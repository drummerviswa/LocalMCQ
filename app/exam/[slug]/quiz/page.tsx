/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, Send, ShieldAlert, CheckCircle2, Terminal } from "lucide-react";
import IntegratedIDE from "@/components/custom/IntegratedIDE";
import CodingArena from "@/components/custom/CodingArena";

export default function ExamQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [teamid, setTeamId] = useState<string | null>(null);
  const [showIDE, setShowIDE] = useState(false);
  const [teamName, setTeamName] = useState<string>("");
  const [examType, setExamType] = useState<"MCQ" | "CODING">("MCQ");
  const [problems, setProblems] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60 * 1000);
  const [startTime, setStartTime] = useState<number>(0);
  const [strikes, setStrikes] = useState<number>(0);
  const [disqualified, setDisqualified] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Initial Load & Team verification
  useEffect(() => {
    const tid = localStorage.getItem(`teamid_${slug}`) || localStorage.getItem("teamid");
    const tname = localStorage.getItem("teamname") || "Candidate";

    if (!tid) {
      router.push(`/exam/${slug}`);
      return;
    }

    setTeamId(tid);
    setTeamName(tname);

    // Load persisted local answers
    const localAns = localStorage.getItem(`quiz_answers_${slug}`);
    if (localAns) {
      try {
        setAnswers(JSON.parse(localAns));
      } catch { }
    }
  }, [slug]);

  // 2. Start Quiz from Server
  useEffect(() => {
    if (!teamid) return;

    fetch(`/api/exam/${slug}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamid }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.success) {
          alert(data.message || "Failed to load quiz");
          router.push(`/exam/${slug}`);
          return;
        }

        if (data.examType === "CODING") {
          setExamType("CODING");
          setProblems(data.problems || []);
          setSubmissions(data.submissions || []);
        } else {
          setExamType("MCQ");
          setQuestions(data.questions || []);
        }
        const dur = data.durationMinutes || 15;
        setDurationMinutes(dur);

        if (!data.startTime) {
          // Initialize timer on server
          const timerRes = await fetch(`/api/exam/${slug}/timer/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamid }),
          });
          const timerData = await timerRes.json();
          setStartTime(Number(timerData.startTime));
          setTimeLeft(dur * 60 * 1000);
        } else {
          setStartTime(Number(data.startTime));
          const elapsed = Date.now() - Number(data.startTime);
          setTimeLeft(Math.max(0, dur * 60 * 1000 - elapsed));
        }

        setLoaded(true);
      })
      .catch((err) => {
        console.error("Quiz start error:", err);
      });
  }, [teamid, slug]);

  // 3. Proctoring Guard (Fullscreen & Tab switches)
  useEffect(() => {
    if (!loaded || !teamid || disqualified) return;

    const recordStrike = async () => {
      try {
        const res = await fetch(`/api/exam/${slug}/strike`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamid }),
        });
        const data = await res.json();
        if (data.success) {
          setStrikes(data.strikes);
          if (data.disqualified) {
            setDisqualified(true);
          } else {
            setShowWarning(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordStrike();
      }
    };

    const handleBlur = () => {
      recordStrike();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    // Request fullscreen on load
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } catch { }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [loaded, teamid, disqualified, slug]);

  // 4. Timer Countdown
  useEffect(() => {
    if (!startTime || disqualified || !loaded) return;

    const totalDurationMs = durationMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = totalDurationMs - elapsed;

      if (left <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        handleSubmitQuiz(true);
      } else {
        setTimeLeft(left);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, disqualified, loaded, durationMinutes]);

  // Save answer
  const handleSelectAnswer = (qid: string, ans: string) => {
    if (disqualified) return;

    const updated = { ...answers, [qid]: ans };
    setAnswers(updated);
    localStorage.setItem(`quiz_answers_${slug}`, JSON.stringify(updated));

    fetch(`/api/exam/${slug}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamid, qid, answer: ans }),
    }).catch(console.error);
  };

  // Submit Quiz
  const handleSubmitQuiz = async (auto = false) => {
    if (!teamid || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/exam/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamid }),
      });
      const data = await res.json();

      // Clear local answers
      localStorage.removeItem(`quiz_answers_${slug}`);

      if (data.showScoreOnSubmit) {
        localStorage.setItem(`latest_score_${slug}`, JSON.stringify(data));
      }

      router.push(`/exam/${slug}/thankyou`);
    } catch (e) {
      console.error(e);
      router.push(`/exam/${slug}/thankyou`);
    }
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (disqualified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-950 p-6 text-center select-none">
        <div className="max-w-md bg-white p-8 border-4 border-red-600 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
          <ShieldAlert className="w-20 h-20 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-red-600 uppercase mb-2">Disqualified</h1>
          <p className="text-zinc-700 font-medium mb-6">
            Multiple proctoring violations (tab switches or exiting fullscreen) were detected. Your exam attempt has been terminated.
          </p>
          <Button
            onClick={() => {
              localStorage.clear();
              router.push(`/exam/${slug}`);
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-none"
          >
            Exit Exam
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const isLastMinute = timeLeft <= 60000;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none flex flex-col relative overflow-hidden">
      {/* Background Watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] z-0 flex flex-wrap gap-16 p-8 overflow-hidden select-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="text-sm font-black uppercase rotate-[-25deg] tracking-widest">
            {teamName} • LOCALMCQ SECURE
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b-4 border-black px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 font-black text-xs sm:text-base uppercase tracking-tight">
            LocalMCQ
          </span>
          <span className="font-extrabold text-xs hidden md:inline text-zinc-600 dark:text-zinc-300">
            Team: <span className="text-black dark:text-white underline">{teamName}</span>
          </span>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isLastMinute ? "text-red-600 animate-spin" : "text-zinc-600"}`} />
          <div
            className={`font-mono text-base sm:text-2xl font-black px-2 sm:px-3 py-0.5 border-2 border-black ${
              isLastMinute
                ? "bg-red-500 text-white animate-pulse"
                : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Right: Progress & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIDE(true)}
            className="font-black uppercase rounded-none border-2 border-black bg-zinc-950 text-emerald-400 hover:bg-black hover:text-emerald-300 text-[11px] sm:text-xs flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 sm:px-3 h-8"
          >
            <Terminal className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sandbox</span>
          </Button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Answered</span>
            <span className="font-black text-sm">
              {answeredCount} / {questions.length}
            </span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            className="font-black uppercase rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-[11px] sm:text-xs px-2.5 sm:px-3 h-8"
          >
            <span className="hidden sm:inline">Submit Exam</span>
            <span className="sm:hidden">Finish</span>
          </Button>
        </div>
      </header>

      {/* Main Body: Branch between Coding Arena and MCQ Quiz */}
      {examType === "CODING" ? (
        <CodingArena
          slug={slug}
          teamid={teamid!}
          problems={problems}
          initialSubmissions={submissions}
          onFinishExam={() => setShowEndConfirm(true)}
        />
      ) : (
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 z-10">
          {/* Left Column: Current Question */}
          <div className="md:col-span-3 flex flex-col justify-between bg-white dark:bg-zinc-900 border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {!loaded || !currentQ ? (
              <div className="flex items-center justify-center h-64 text-zinc-400 font-bold animate-pulse">
                Loading Question Bank...
              </div>
            ) : (
              <div>
                {/* Question Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-zinc-200 dark:border-zinc-800">
                  <span className="font-black text-sm uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-3 py-1 border border-blue-400">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-400">
                    {currentQ.category || "General"} • {currentQ.points || 1} Pt
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-4 text-zinc-900 dark:text-zinc-100">
                  {currentQ.question}
                </h2>

                {/* Code Snippet if present */}
                {currentQ.codeSnippet && (
                  <div className="mb-6 p-4 bg-zinc-950 text-emerald-400 font-mono text-sm rounded-none border-2 border-zinc-800 overflow-x-auto">
                    <pre>{currentQ.codeSnippet}</pre>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3 mt-6">
                  {Array.isArray(currentQ.options) &&
                    currentQ.options.map((opt: string, oIdx: number) => {
                      const isSelected = answers[currentQ.id] === opt;
                      const letter = String.fromCharCode(65 + oIdx);

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQ.id, opt)}
                          className={`w-full text-left p-4 border-2 transition-all flex items-center gap-4 ${
                            isSelected
                              ? "border-black bg-blue-600 text-white font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-black hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-none border-2 flex items-center justify-center font-black text-sm shrink-0 ${
                              isSelected
                                ? "border-white bg-white text-blue-600"
                                : "border-black bg-white dark:bg-zinc-900 text-black dark:text-white"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-base font-medium flex-1">{opt}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Prev / Next Navigation Controls */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="font-bold border-2 border-black rounded-none"
              >
                ← Previous
              </Button>
              <div className="text-xs font-bold text-zinc-400 uppercase">
                Auto-saved to server
              </div>
              <Button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="font-bold border-2 border-black rounded-none bg-black text-white hover:bg-zinc-800"
              >
                Next →
              </Button>
            </div>
          </div>

          {/* Right Column: Question Palette */}
          <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider mb-3 pb-2 border-b-2 border-black">
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentIdx === i;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(i)}
                      className={`h-10 font-black text-xs border-2 transition-all flex items-center justify-center ${
                        isCurrent
                          ? "border-black ring-2 ring-blue-500 scale-105"
                          : "border-zinc-400"
                      } ${
                        isAnswered
                          ? "bg-emerald-500 text-white border-black"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t-2 border-zinc-200 dark:border-zinc-800 space-y-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-emerald-500 border border-black inline-block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-zinc-100 border border-zinc-400 inline-block"></span>
                <span>Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctor Strike Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="border-4 border-red-600 rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-red-600 uppercase flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> Malpractice Warning
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-center">
            <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-4">
              Window focus lost or fullscreen exit detected. An incident has been logged.
            </p>
            <div className="p-4 bg-red-100 dark:bg-red-950/50 border-2 border-red-500 mb-3">
              <span className="text-xs uppercase font-bold text-red-800 dark:text-red-300">
                Strike Count
              </span>
              <div className="text-4xl font-black text-red-600">{strikes} / 3</div>
            </div>
            <p className="text-xs text-red-600 font-bold uppercase">
              Warning: 3 strikes will result in automatic disqualification!
            </p>
          </div>
          <Button
            onClick={() => {
              setShowWarning(false);
              document.documentElement.requestFullscreen?.().catch(() => {});
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-none"
          >
            I Understand, Return to Test
          </Button>
        </DialogContent>
      </Dialog>

      {/* End Exam Confirm Modal */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent className="border-4 border-black rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Submit Quiz?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-zinc-700 dark:text-zinc-300 font-medium">
            <p>
              You have answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.
            </p>
            <p className="text-sm text-zinc-500">
              Once submitted, you will not be able to return to change your answers.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndConfirm(false)} className="rounded-none border-2 border-black font-bold">
              Continue Test
            </Button>
            <Button
              disabled={submitting}
              onClick={() => handleSubmitQuiz(false)}
              className="rounded-none border-2 border-black bg-red-600 hover:bg-red-700 text-white font-black uppercase"
            >
              {submitting ? "Submitting..." : "Yes, Submit Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* In-Exam Code Sandbox Dialog */}
      <Dialog open={showIDE} onOpenChange={setShowIDE}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 border-4 border-black rounded-none">
          <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center flex-row">
            <DialogTitle className="text-sm font-black uppercase text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Proctored In-Test Code Sandbox
            </DialogTitle>
          </DialogHeader>
          <div className="p-2 bg-zinc-950">
            <IntegratedIDE className="border-0 shadow-none" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
