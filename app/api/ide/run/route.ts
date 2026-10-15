/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { execFile, spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const TIMEOUT_MS = 6000; // 6 seconds execution limit to prevent infinite loops

interface RunRequest {
  language: "python" | "c" | "cpp" | "java" | "javascript";
  code: string;
  input?: string;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let tempDir = "";

  try {
    const { language, code, input } = (await req.json()) as RunRequest;

    if (!code || typeof code !== "string" || code.trim() === "") {
      return NextResponse.json({ success: false, error: "Source code cannot be empty" }, { status: 400 });
    }

    // Try Local Execution first
    try {
      const runId = crypto.randomBytes(6).toString("hex");
      tempDir = path.join(os.tmpdir(), `localmcq_ide_${runId}`);
      await fs.mkdir(tempDir, { recursive: true });

      let result: { stdout: string; stderr: string; exitCode: number } = { stdout: "", stderr: "", exitCode: 0 };

      if (language === "python") {
        const filePath = path.join(tempDir, "main.py");
        await fs.writeFile(filePath, code, "utf-8");
        result = await executeProcess("python", [filePath], tempDir, input || "");
      } else if (language === "javascript") {
        const filePath = path.join(tempDir, "main.js");
        await fs.writeFile(filePath, code, "utf-8");
        result = await executeProcess("node", [filePath], tempDir, input || "");
      } else if (language === "c") {
        const srcPath = path.join(tempDir, "main.c");
        const exePath = path.join(tempDir, "main.exe");
        await fs.writeFile(srcPath, code, "utf-8");

        // Compile
        const compile = await executeProcess("gcc", [srcPath, "-o", exePath], tempDir, "");
        if (compile.exitCode !== 0) {
          return NextResponse.json({
            success: false,
            error: compile.stderr || "Compilation Error",
            executionTime: Date.now() - startTime,
          });
        }
        result = await executeProcess(exePath, [], tempDir, input || "");
      } else if (language === "cpp") {
        const srcPath = path.join(tempDir, "main.cpp");
        const exePath = path.join(tempDir, "main.exe");
        await fs.writeFile(srcPath, code, "utf-8");

        // Compile
        const compile = await executeProcess("g++", [srcPath, "-o", exePath], tempDir, "");
        if (compile.exitCode !== 0) {
          return NextResponse.json({
            success: false,
            error: compile.stderr || "Compilation Error",
            executionTime: Date.now() - startTime,
          });
        }
        result = await executeProcess(exePath, [], tempDir, input || "");
      } else if (language === "java") {
        const srcPath = path.join(tempDir, "Main.java");
        await fs.writeFile(srcPath, code, "utf-8");

        // Compile
        const compile = await executeProcess("javac", [srcPath], tempDir, "");
        if (compile.exitCode !== 0) {
          return NextResponse.json({
            success: false,
            error: compile.stderr || "Java Compilation Error",
            executionTime: Date.now() - startTime,
          });
        }
        result = await executeProcess("java", ["-cp", tempDir, "Main"], tempDir, input || "");
      } else {
        return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
      }

      const executionTime = Date.now() - startTime;
      return NextResponse.json({
        success: result.exitCode === 0,
        output: result.stdout || (result.exitCode === 0 ? "(Program exited with code 0 - no output)" : ""),
        error: result.stderr || undefined,
        executionTime,
      });
    } catch (localErr: any) {
      console.warn("Local execution failed, falling back to online sandbox runner:", localErr.message);

      // Fallback: Online Piston API
      const fallbackResult = await runOnPiston(language, code, input || "");
      return NextResponse.json({
        ...fallbackResult,
        executionTime: Date.now() - startTime,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (tempDir) {
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Process runner with timeout and stdin pipe
function executeProcess(
  cmd: string,
  args: string[],
  cwd: string,
  input: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const child = spawn(cmd, args, { cwd, shell: false });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        child.kill();
        resolve({
          stdout,
          stderr: "Time Limit Exceeded (Execution exceeded 6.0 seconds)",
          exitCode: 124,
        });
      }
    }, TIMEOUT_MS);

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      }
    });
  });
}

// Fallback to Piston API
async function runOnPiston(language: string, code: string, stdin: string) {
  const langMap: Record<string, { lang: string; version: string; file: string }> = {
    python: { lang: "python", version: "3.10.0", file: "main.py" },
    javascript: { lang: "javascript", version: "18.15.0", file: "main.js" },
    c: { lang: "c", version: "10.2.0", file: "main.c" },
    cpp: { lang: "c++", version: "10.2.0", file: "main.cpp" },
    java: { lang: "java", version: "15.0.2", file: "Main.java" },
  };

  const config = langMap[language] || { lang: language, version: "*", file: "code" };

  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: config.lang,
      version: config.version,
      files: [{ name: config.file, content: code }],
      stdin,
    }),
  });

  const data = await res.json();
  const run = data.run || {};

  return {
    success: run.code === 0,
    output: run.stdout || (run.code === 0 ? "(Program exited with code 0 - no output)" : ""),
    error: run.stderr || undefined,
  };
}
