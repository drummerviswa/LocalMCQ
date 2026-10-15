/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Code2,
  FileText,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

interface CodingArenaProps {
  slug: string;
  teamid: string;
  problems: any[];
  initialSubmissions?: any[];
  onFinishExam: () => void;
}

const DEFAULT_STARTERS: Record<string, string> = {
  python: `# Write your solution in Python 3
import sys

def solve():
    # Read all inputs from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Example: print sum of two numbers
    # a, b = int(input_data[0]), int(input_data[1])
    # print(a + b)

if __name__ == "__main__":
    solve()
`,
  cpp: `// Write your solution in C++ (g++)
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input from standard input
    // int a, b;
    // if (cin >> a >> b) {
    //     cout << (a + b) << "\\n";
    // }

    return 0;
}
`,
  c: `// Write your solution in C (gcc)
#include <stdio.h>

int main() {
    // Read input from standard input
    // int a, b;
    // if (scanf("%d %d", &a, &b) == 2) {
    //     printf("%d\\n", a + b);
    // }
    return 0;
}
`,
  java: `// Write your solution in Java 17
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // if (scanner.hasNextInt()) {
        //     int a = scanner.nextInt();
        //     int b = scanner.nextInt();
        //     System.out.println(a + b);
        // }
    }
}
`,
  javascript: `// Write your solution in JavaScript (Node.js)
const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    // const a = parseInt(input[0], 10);
    // const b = parseInt(input[1], 10);
    // console.log(a + b);
}

main();
`,
};

export default function CodingArena({
  slug,
  teamid,
  problems,
  initialSubmissions = [],
  onFinishExam,
}: CodingArenaProps) {
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [language, setLanguage] = useState<string>("python");

  // Code state per problem
  const [codePerProblem, setCodePerProblem] = useState<Record<string, Record<string, string>>>({});

  // Submissions list
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);

  // Execution states
  const [runningSamples, setRunningSamples] = useState(false);
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [sampleResults, setSampleResults] = useState<any | null>(null);
  const [submitVerdict, setSubmitVerdict] = useState<any | null>(null);

  // Console tab
  const [consoleTab, setConsoleTab] = useState<"samples" | "verdict" | "submissions">("samples");

  // Mobile/Tablet View Switcher
  const [mobileTab, setMobileTab] = useState<"problem" | "editor" | "console">("problem");

  const currentProblem = problems[activeProblemIdx];

  // Helper to get active code for current problem and language
  const currentCode =
    codePerProblem[currentProblem?.id]?.[language] ??
    currentProblem?.starterCode?.[language] ??
    DEFAULT_STARTERS[language] ??
    "";

  const handleCodeChange = (newVal: string | undefined) => {
    if (!currentProblem) return;
    setCodePerProblem((prev) => ({
      ...prev,
      [currentProblem.id]: {
        ...(prev[currentProblem.id] || {}),
        [language]: newVal || "",
      },
    }));
  };

  // Run visible sample test cases
  const handleRunSamples = async () => {
    if (!currentProblem || runningSamples) return;
    setRunningSamples(true);
    setSampleResults(null);
    setConsoleTab("samples");
    setMobileTab("console");

    try {
      const res = await fetch(`/api/exam/${slug}/code/run-samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: currentProblem.id,
          language,
          code: currentCode,
        }),
      });
      const data = await res.json();
      setSampleResults(data);
    } catch (err: any) {
      setSampleResults({
        success: false,
        status: "RUNTIME_ERROR",
        compileError: err.message,
        results: [],
      });
    } finally {
      setRunningSamples(false);
    }
  };

  // Submit code to all test cases (Evaluation)
  const handleSubmitSolution = async () => {
    if (!currentProblem || submittingSolution) return;
    setSubmittingSolution(true);
    setSubmitVerdict(null);
    setConsoleTab("verdict");
    setMobileTab("console");

    try {
      const res = await fetch(`/api/exam/${slug}/code/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamid,
          problemId: currentProblem.id,
          language,
          code: currentCode,
        }),
      });
      const data = await res.json();
      setSubmitVerdict(data);

      if (data.success) {
        // Prepend new submission
        setSubmissions((prev) => [
          {
            id: data.submissionId,
            problemId: currentProblem.id,
            status: data.status,
            testCasesPassed: data.passedCount,
            totalTestCases: data.totalCount,
            score: data.earnedScore,
            language,
            submittedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setSubmitVerdict({
        success: false,
        status: "RUNTIME_ERROR",
        compileError: err.message,
      });
    } finally {
      setSubmittingSolution(false);
    }
  };

  // Filter submissions for this problem
  const problemSubmissions = submissions.filter((s) => s.problemId === currentProblem?.id);
  const bestProblemScore = problemSubmissions.reduce((max, s) => Math.max(max, s.score || 0), 0);

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400 font-bold">
        No coding problems configured for this contest.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-zinc-950 text-white select-none">
      {/* Mobile/Tablet Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden bg-zinc-900 border-b-2 border-black p-1.5 gap-1.5 shrink-0 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("problem")}
          className={`flex-1 py-1.5 font-black text-xs uppercase border-2 flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "problem"
              ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Problem
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-1.5 font-black text-xs uppercase border-2 flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "editor"
              ? "bg-purple-600 text-white border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("console")}
          className={`flex-1 py-1.5 font-black text-xs uppercase border-2 flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "console"
              ? "bg-emerald-600 text-white border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Console
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= LEFT PANEL: PROBLEM DESCRIPTION ================= */}
        <div
          className={`w-full lg:w-5/12 flex flex-col border-r-4 border-black bg-zinc-900 overflow-y-auto ${
            mobileTab !== "problem" ? "hidden lg:flex" : "flex"
          }`}
        >
        {/* Problems Tab Header */}
        <div className="p-3 bg-black border-b-2 border-zinc-800 flex items-center gap-2 overflow-x-auto">
          {problems.map((p, idx) => {
            const isSelected = activeProblemIdx === idx;
            const probBest = submissions
              .filter((s) => s.problemId === p.id)
              .reduce((m, s) => Math.max(m, s.score || 0), 0);
            const isFullScore = probBest >= p.points && p.points > 0;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProblemIdx(idx);
                  setSampleResults(null);
                  setSubmitVerdict(null);
                }}
                className={`px-3 py-1.5 text-xs font-black uppercase whitespace-nowrap border-2 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {isFullScore && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                Problem {idx + 1} ({p.points} pts)
              </button>
            );
          })}
        </div>

        {/* Problem Body */}
        <div className="p-6 flex-1 space-y-6">
          {/* Header Title & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                  currentProblem.difficulty === "Easy"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                    : currentProblem.difficulty === "Hard"
                    ? "bg-red-950 text-red-300 border-red-600"
                    : "bg-yellow-950 text-yellow-300 border-yellow-600"
                }`}
              >
                {currentProblem.difficulty}
              </span>
              <span className="text-xs font-bold text-zinc-400">
                Score: <b className="text-white">{bestProblemScore}</b> / {currentProblem.points} pts
              </span>
            </div>

            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              {currentProblem.title}
            </h1>
          </div>

          {/* Statement */}
          <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans">
            {currentProblem.description}
          </div>

          {/* Input Format */}
          {currentProblem.inputFormat && (
            <div className="bg-black/40 p-4 border border-zinc-800">
              <h3 className="text-xs font-black uppercase text-zinc-400 mb-1">Input Format</h3>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">{currentProblem.inputFormat}</p>
            </div>
          )}

          {/* Output Format */}
          {currentProblem.outputFormat && (
            <div className="bg-black/40 p-4 border border-zinc-800">
              <h3 className="text-xs font-black uppercase text-zinc-400 mb-1">Output Format</h3>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">{currentProblem.outputFormat}</p>
            </div>
          )}

          {/* Constraints */}
          {currentProblem.constraints && (
            <div className="bg-black/40 p-4 border border-zinc-800">
              <h3 className="text-xs font-black uppercase text-zinc-400 mb-1">Constraints</h3>
              <p className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                {currentProblem.constraints}
              </p>
            </div>
          )}

          {/* Visible Sample Test Cases */}
          {Array.isArray(currentProblem.testCases) && currentProblem.testCases.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">
                Sample Test Cases
              </h3>
              {currentProblem.testCases.map((tc: any, i: number) => (
                <div key={tc.id || i} className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-blue-400 uppercase">Sample {i + 1}</div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Input:</span>
                      <pre className="bg-black p-2 border border-zinc-800 overflow-x-auto text-zinc-300">
                        {tc.input || "(empty)"}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                        Expected Output:
                      </span>
                      <pre className="bg-black p-2 border border-zinc-800 overflow-x-auto text-emerald-400">
                        {tc.expectedOutput || "(empty)"}
                      </pre>
                    </div>
                  </div>
                  {tc.explanation && (
                    <p className="text-xs text-zinc-400 italic">
                      <b>Explanation:</b> {tc.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANEL: MONACO EDITOR & TEST CONSOLE ================= */}
      <div
        className={`w-full lg:w-7/12 flex flex-col bg-zinc-950 overflow-hidden ${
          mobileTab === "problem" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Editor Controls Bar */}
        <div className="bg-zinc-900 border-b-2 border-zinc-800 px-4 py-2 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black text-white font-bold text-xs uppercase px-2.5 py-1.5 border border-zinc-700 rounded-none focus:outline-none focus:border-emerald-500"
            >
              <option value="python">Python 3.14</option>
              <option value="cpp">C++ (g++)</option>
              <option value="c">C (gcc)</option>
              <option value="java">Java 17 (JDK)</option>
              <option value="javascript">JavaScript (Node)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCodeChange(DEFAULT_STARTERS[language])}
              className="text-xs text-zinc-400 hover:text-white rounded-none h-8 px-2"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>

            <Button
              size="sm"
              disabled={runningSamples || submittingSolution}
              onClick={handleRunSamples}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-none h-8 border border-zinc-600 flex items-center gap-1.5"
            >
              <Play className={`w-3.5 h-3.5 ${runningSamples ? "animate-spin" : ""}`} />
              {runningSamples ? "Testing..." : "Run Samples"}
            </Button>

            <Button
              size="sm"
              disabled={runningSamples || submittingSolution}
              onClick={handleSubmitSolution}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs rounded-none h-8 px-3 sm:px-4 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              <Send className={`w-3.5 h-3.5 ${submittingSolution ? "animate-pulse" : ""}`} />
              {submittingSolution ? "Evaluating..." : "Submit Solution"}
            </Button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div
          className={`relative border-b-2 border-zinc-800 ${
            mobileTab === "console" ? "hidden lg:block lg:flex-1 min-h-[250px]" : "flex-1 min-h-[250px]"
          }`}
        >
          <Editor
            height="100%"
            theme="vs-dark"
            language={
              language === "cpp" || language === "c"
                ? "cpp"
                : language === "python"
                ? "python"
                : language === "java"
                ? "java"
                : "javascript"
            }
            value={currentCode}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "Fira Code, Consolas, monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
            }}
          />
        </div>

        {/* Bottom Test & Verdict Console */}
        <div
          className={`flex flex-col bg-zinc-950 font-mono text-xs ${
            mobileTab === "editor" ? "hidden lg:flex lg:h-64" : "flex-1 lg:flex-none lg:h-64"
          }`}
        >
          {/* Console Tab Selector */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5 flex gap-3 text-xs">
            <button
              onClick={() => setConsoleTab("samples")}
              className={`px-3 py-1 font-bold uppercase transition-all ${
                consoleTab === "samples"
                  ? "bg-black text-blue-400 border-t-2 border-blue-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sample Tests Result
            </button>
            <button
              onClick={() => setConsoleTab("verdict")}
              className={`px-3 py-1 font-bold uppercase transition-all ${
                consoleTab === "verdict"
                  ? "bg-black text-emerald-400 border-t-2 border-emerald-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Submission Verdict {submitVerdict ? "•" : ""}
            </button>
            <button
              onClick={() => setConsoleTab("submissions")}
              className={`px-3 py-1 font-bold uppercase transition-all ${
                consoleTab === "submissions"
                  ? "bg-black text-yellow-400 border-t-2 border-yellow-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Submissions History ({problemSubmissions.length})
            </button>
          </div>

          {/* Console Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* TAB: Sample Results */}
            {consoleTab === "samples" && (
              <div>
                {runningSamples && (
                  <div className="text-zinc-400 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                    Running your code against sample test cases...
                  </div>
                )}

                {sampleResults && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm uppercase ${
                            sampleResults.status === "ACCEPTED" ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {sampleResults.status === "ACCEPTED" ? "✓ All Sample Tests Passed!" : sampleResults.status}
                        </span>
                        <span className="text-zinc-500 text-xs">
                          ({sampleResults.passedCount} / {sampleResults.totalCount} passed)
                        </span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">⏱ {sampleResults.totalTimeMs}ms</span>
                    </div>

                    {sampleResults.compileError && (
                      <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 whitespace-pre-wrap text-xs">
                        {sampleResults.compileError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sampleResults.results?.map((res: any) => (
                        <div
                          key={res.index}
                          className={`p-3 border text-xs ${
                            res.passed ? "bg-emerald-950/30 border-emerald-600" : "bg-red-950/30 border-red-600"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold">Test Case {res.index}</span>
                            <span className={`font-black ${res.passed ? "text-emerald-400" : "text-red-400"}`}>
                              {res.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div>
                              <span className="text-zinc-500">Input:</span>{" "}
                              <code className="text-zinc-300">{res.input}</code>
                            </div>
                            <div>
                              <span className="text-zinc-500">Expected:</span>{" "}
                              <code className="text-emerald-400">{res.expectedOutput}</code>
                            </div>
                            <div>
                              <span className="text-zinc-500">Output:</span>{" "}
                              <code className={res.passed ? "text-emerald-400" : "text-red-400"}>
                                {res.actualOutput || "(empty)"}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!runningSamples && !sampleResults && (
                  <div className="text-zinc-500 italic">
                    Click "Run Samples" to test your logic on the visible example cases before final submission.
                  </div>
                )}
              </div>
            )}

            {/* TAB: Submission Verdict */}
            {consoleTab === "verdict" && (
              <div>
                {submittingSolution && (
                  <div className="text-zinc-400 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Evaluating code against all hidden & system test cases...
                  </div>
                )}

                {submitVerdict && (
                  <div className="space-y-4">
                    <div className="p-4 border-2 flex items-center justify-between bg-zinc-900 border-zinc-700">
                      <div>
                        <div
                          className={`text-2xl font-black uppercase flex items-center gap-2 ${
                            submitVerdict.status === "ACCEPTED"
                              ? "text-emerald-400"
                              : submitVerdict.status === "TIME_LIMIT_EXCEEDED"
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {submitVerdict.status === "ACCEPTED" ? (
                            <>
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Accepted!
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6" /> {submitVerdict.status}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          Test cases passed:{" "}
                          <b className="text-white">
                            {submitVerdict.passedCount} / {submitVerdict.totalCount}
                          </b>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black text-emerald-400">
                          +{submitVerdict.earnedScore} pts
                        </div>
                        <div className="text-xs text-zinc-500">
                          Total Problem Score: {bestProblemScore} / {currentProblem.points}
                        </div>
                      </div>
                    </div>

                    {submitVerdict.compileError && (
                      <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 whitespace-pre-wrap text-xs">
                        {submitVerdict.compileError}
                      </div>
                    )}

                    {/* Test cases grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {submitVerdict.results?.map((res: any) => (
                        <div
                          key={res.index}
                          className={`p-2 border text-center text-xs ${
                            res.passed
                              ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                              : "bg-red-950/40 border-red-600 text-red-300"
                          }`}
                        >
                          <div className="font-bold">Test #{res.index}</div>
                          <div className="text-[10px] font-black uppercase mt-0.5">
                            {res.passed ? "Passed" : res.status}
                          </div>
                          {res.isHidden && (
                            <div className="text-[9px] text-zinc-500 italic mt-0.5">[Hidden]</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!submittingSolution && !submitVerdict && (
                  <div className="text-zinc-500 italic">
                    Submit your solution to run it against all test cases for points on the leaderboard.
                  </div>
                )}
              </div>
            )}

            {/* TAB: Submissions History */}
            {consoleTab === "submissions" && (
              <div>
                {problemSubmissions.length === 0 ? (
                  <div className="text-zinc-500 italic">No submissions recorded yet for this problem.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Status</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Test Cases</th>
                        <th className="p-2">Language</th>
                        <th className="p-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {problemSubmissions.map((sub, i) => (
                        <tr key={sub.id || i} className="hover:bg-zinc-900/60">
                          <td className="p-2 font-black">
                            <span
                              className={
                                sub.status === "ACCEPTED"
                                  ? "text-emerald-400"
                                  : sub.status === "TIME_LIMIT_EXCEEDED"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-white">+{sub.score} pts</td>
                          <td className="p-2 text-zinc-400">
                            {sub.testCasesPassed} / {sub.totalTestCases}
                          </td>
                          <td className="p-2 uppercase text-zinc-500 text-[10px]">{sub.language}</td>
                          <td className="p-2 text-right text-zinc-500 text-[10px]">
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
