/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trash2, Clock, CheckCircle2, AlertCircle, Terminal } from "lucide-react";

export type SupportedLanguage = "python" | "c" | "cpp" | "java" | "javascript";

const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# Python 3.14 Environment
def solve():
    print("Hello from LocalMCQ Python Runner!")
    # Read input example:
    # name = input()
    # print(f"Welcome, {name}!")

if __name__ == "__main__":
    solve()
`,
  c: `// C (gcc) Environment
#include <stdio.h>

int main() {
    printf("Hello from LocalMCQ C Runner!\\n");
    // int x;
    // scanf("%d", &x);
    // printf("Value: %d\\n", x);
    return 0;
}
`,
  cpp: `// C++ (g++) Environment
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Hello from LocalMCQ C++ Runner!" << endl;
    // string name;
    // cin >> name;
    // cout << "Hello, " << name << endl;
    return 0;
}
`,
  java: `// Java 17 Environment
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from LocalMCQ Java Runner!");
        // Scanner scanner = new Scanner(System.in);
        // String line = scanner.nextLine();
        // System.out.println("Input: " + line);
    }
}
`,
  javascript: `// JavaScript (Node.js) Environment
function main() {
    console.log("Hello from LocalMCQ JS Runner!");
    const nums = [1, 2, 3, 4, 5];
    console.log("Sum:", nums.reduce((a, b) => a + b, 0));
}

main();
`,
};

export default function IntegratedIDE({ className = "" }: { className?: string }) {
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState<string>(STARTER_TEMPLATES.python);
  const [stdin, setStdin] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "stdin">("output");

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(STARTER_TEMPLATES[newLang]);
    setOutput("");
    setError(null);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setError(null);
    setOutput("");
    setActiveBottomTab("output");

    try {
      const res = await fetch("/api/ide/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          input: stdin,
        }),
      });

      const data = await res.json();
      setExecTime(data.executionTime ?? null);

      if (!res.ok || !data.success) {
        setError(data.error || "Execution Error");
        setOutput(data.output || "");
      } else {
        setOutput(data.output || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with compiler runner");
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enable Tab indentation inside textarea
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div className={`flex flex-col bg-zinc-950 text-zinc-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono ${className}`}>
      {/* Top IDE Toolbar */}
      <div className="bg-zinc-900 border-b-2 border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-sm uppercase text-white font-sans tracking-wide">
              Online IDE & Sandbox
            </span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-black text-white font-bold text-xs uppercase px-3 py-1.5 border border-zinc-700 rounded-none focus:outline-none focus:border-emerald-500"
          >
            <option value="python">Python 3.14</option>
            <option value="c">C (gcc)</option>
            <option value="cpp">C++ (g++)</option>
            <option value="java">Java 17 (JDK)</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCode(STARTER_TEMPLATES[language])}
            title="Reset to starter template"
            className="text-zinc-400 hover:text-white text-xs rounded-none h-8 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>

          <Button
            size="sm"
            disabled={running}
            onClick={handleRunCode}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs rounded-none px-4 h-8 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${running ? "animate-spin" : ""}`} />
            {running ? "Compiling..." : "Run Code"}
          </Button>
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="flex-1 flex overflow-hidden border-b-2 border-zinc-800 min-h-[320px] max-h-[500px]">
        {/* Line Numbers */}
        <div className="bg-zinc-900/60 text-zinc-600 select-none py-3 px-3 text-right text-xs font-mono border-r border-zinc-800/80 shrink-0">
          {Array.from({ length: Math.max(lineCount, 12) }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-zinc-950 text-zinc-100 p-3 font-mono text-xs md:text-sm leading-6 resize-none focus:outline-none selection:bg-blue-900"
          placeholder="Write your code here..."
        />
      </div>

      {/* Bottom Console Tabs (Output / Stdin) */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5 flex justify-between items-center text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveBottomTab("output")}
            className={`px-3 py-1 font-bold uppercase transition-all ${
              activeBottomTab === "output"
                ? "bg-black text-emerald-400 border-t-2 border-emerald-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Output & Logs
          </button>
          <button
            onClick={() => setActiveBottomTab("stdin")}
            className={`px-3 py-1 font-bold uppercase transition-all ${
              activeBottomTab === "stdin"
                ? "bg-black text-blue-400 border-t-2 border-blue-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Custom Input (stdin) {stdin.trim() ? "•" : ""}
          </button>
        </div>

        {execTime !== null && (
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Time: {execTime}ms</span>
          </div>
        )}
      </div>

      {/* Bottom Console Panel */}
      <div className="p-4 bg-zinc-950 min-h-[140px] max-h-[220px] overflow-y-auto text-xs font-mono">
        {activeBottomTab === "output" ? (
          <div>
            {running && (
              <div className="text-zinc-400 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Executing program in sandbox...
              </div>
            )}

            {error && (
              <div className="text-red-400 bg-red-950/40 p-3 border border-red-800/80 mb-2 whitespace-pre-wrap flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <div className="font-bold text-[11px] uppercase tracking-wider mb-1">Execution / Runtime Error:</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {output && (
              <div className="text-zinc-200 whitespace-pre-wrap">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Program Output:</div>
                <div className="bg-black/60 p-3 border border-zinc-800 text-emerald-300 font-mono">
                  {output}
                </div>
              </div>
            )}

            {!running && !error && !output && (
              <div className="text-zinc-600 italic">
                Press "Run Code" above to compile and execute your code.
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5">
              Input data passed to program via standard input (stdin):
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g. 42 \n John \n 3.14"
              rows={4}
              className="w-full bg-black text-zinc-200 p-2.5 border border-zinc-800 focus:outline-none focus:border-blue-500 text-xs font-mono resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
