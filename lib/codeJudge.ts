/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const TIME_LIMIT_MS = 3500; // 3.5 seconds per test case

export interface TestCasePayload {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  index: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  isHidden?: boolean;
  timeMs: number;
  status: "PASSED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR";
}

export interface JudgeResult {
  status: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "COMPILATION_ERROR" | "RUNTIME_ERROR";
  compileError?: string;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
  totalTimeMs: number;
}

export async function judgeCode(
  language: "python" | "c" | "cpp" | "java" | "javascript",
  code: string,
  testCases: TestCasePayload[]
): Promise<JudgeResult> {
  const startTime = Date.now();
  const runId = crypto.randomBytes(6).toString("hex");
  const tempDir = path.join(os.tmpdir(), `localmcq_judge_${runId}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    let compileCmd = "";
    let compileArgs: string[] = [];
    let runCmd = "";
    let runArgs: string[] = [];

    if (language === "python") {
      const src = path.join(tempDir, "solution.py");
      await fs.writeFile(src, code, "utf-8");
      runCmd = "python";
      runArgs = [src];
    } else if (language === "javascript") {
      const src = path.join(tempDir, "solution.js");
      await fs.writeFile(src, code, "utf-8");
      runCmd = "node";
      runArgs = [src];
    } else if (language === "c") {
      const src = path.join(tempDir, "solution.c");
      const exe = path.join(tempDir, "solution.exe");
      await fs.writeFile(src, code, "utf-8");
      compileCmd = "gcc";
      compileArgs = [src, "-o", exe];
      runCmd = exe;
      runArgs = [];
    } else if (language === "cpp") {
      const src = path.join(tempDir, "solution.cpp");
      const exe = path.join(tempDir, "solution.exe");
      await fs.writeFile(src, code, "utf-8");
      compileCmd = "g++";
      compileArgs = [src, "-o", exe];
      runCmd = exe;
      runArgs = [];
    } else if (language === "java") {
      const src = path.join(tempDir, "Main.java");
      await fs.writeFile(src, code, "utf-8");
      compileCmd = "javac";
      compileArgs = [src];
      runCmd = "java";
      runArgs = ["-cp", tempDir, "Main"];
    }

    // Step 1: Compile if necessary
    if (compileCmd) {
      const compile = await runProcess(compileCmd, compileArgs, tempDir, "", 8000);
      if (compile.exitCode !== 0) {
        return {
          status: "COMPILATION_ERROR",
          compileError: compile.stderr || "Compilation failed",
          passedCount: 0,
          totalCount: testCases.length,
          results: [],
          totalTimeMs: Date.now() - startTime,
        };
      }
    }

    // Step 2: Run through test cases
    const results: TestCaseResult[] = [];
    let passedCount = 0;
    let worstStatus: JudgeResult["status"] = "ACCEPTED";

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const tcStart = Date.now();
      const run = await runProcess(runCmd, runArgs, tempDir, tc.input || "", TIME_LIMIT_MS);
      const tcElapsed = Date.now() - tcStart;

      const normalizedExpected = normalizeOutput(tc.expectedOutput);
      const normalizedActual = normalizeOutput(run.stdout);

      let status: TestCaseResult["status"] = "PASSED";

      if (run.isTimedOut) {
        status = "TIME_LIMIT_EXCEEDED";
        if (worstStatus === "ACCEPTED") worstStatus = "TIME_LIMIT_EXCEEDED";
      } else if (run.exitCode !== 0) {
        status = "RUNTIME_ERROR";
        if (worstStatus === "ACCEPTED" || worstStatus === "WRONG_ANSWER") worstStatus = "RUNTIME_ERROR";
      } else if (normalizedActual !== normalizedExpected) {
        status = "WRONG_ANSWER";
        if (worstStatus === "ACCEPTED") worstStatus = "WRONG_ANSWER";
      } else {
        passedCount++;
      }

      results.push({
        index: i + 1,
        passed: status === "PASSED",
        input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actualOutput: tc.isHidden ? (status === "PASSED" ? "Passed" : "Wrong Output") : run.stdout,
        error: tc.isHidden ? undefined : (run.stderr || undefined),
        isHidden: tc.isHidden,
        timeMs: tcElapsed,
        status,
      });
    }

    const finalStatus = passedCount === testCases.length ? "ACCEPTED" : worstStatus;

    return {
      status: finalStatus,
      passedCount,
      totalCount: testCases.length,
      results,
      totalTimeMs: Date.now() - startTime,
    };
  } finally {
    fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function normalizeOutput(out: string): string {
  if (!out) return "";
  return out
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

function runProcess(
  cmd: string,
  args: string[],
  cwd: string,
  input: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; isTimedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let isSettled = false;
    let isTimedOut = false;

    const child = spawn(cmd, args, { cwd, shell: false });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        isTimedOut = true;
        child.kill();
        resolve({
          stdout,
          stderr: "Time Limit Exceeded",
          exitCode: 124,
          isTimedOut: true,
        });
      }
    }, timeoutMs);

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr: err.message, exitCode: 1, isTimedOut: false });
      }
    });

    child.on("close", (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code ?? 0, isTimedOut });
      }
    });
  });
}
