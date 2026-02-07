/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import Timer from "@/components/custom/Timer";
import QuestionBox from "@/components/custom/QuestionBox";
import ConfirmDialog from "@/components/custom/ConfirmDialog";
import { getRandomQuestions, evaluateAnswers } from "@/helper/quiz";
import instance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import useExamGuard from "@/helper/useExamGuard";
import MalpracticeDialog from "@/components/custom/MalpracticeDialog";
import useFullscreenLock from "@/helper/useFullscreenLock";

export default function QuizPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [malOpen, setMalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [strikes, setStrikes] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("quiz_questions");
    const savedAnswers = localStorage.getItem("quiz_answers");

    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

    if (saved) {
      setQuestions(JSON.parse(saved));
    } else {
      const q = getRandomQuestions();
      localStorage.setItem("quiz_questions", JSON.stringify(q));
      setQuestions(q);
    }

    // ✅ SAFE localStorage reads
    const name = localStorage.getItem("teamname") || "";
    const details = localStorage.getItem("teamDetails");
    const s = Number(localStorage.getItem("mal_strikes") || "1");

    setTeamName(name);
    setStrikes(s);

    if (details) {
      const parsed = JSON.parse(details);
      setP1(parsed.members[0]?.name || "");
      setP2(parsed.members[1]?.name || "");
    }

    document.documentElement.requestFullscreen();
  }, []);

  const setAnswer = (i: number, val: string) => {
    const updated = { ...answers, [i]: val };
    setAnswers(updated);
    localStorage.setItem("quiz_answers", JSON.stringify(updated));
  };

  const endTest = async () => {
    const score = evaluateAnswers(questions, answers);
    const teamid = localStorage.getItem("teamid");

    await instance.post("/quiz/submit", {
      questions,
      answers: Object.values(answers),
      timeTaken: Date.now() - Number(localStorage.getItem("quiz_start")),
      teamid,
      score,
    });

    localStorage.clear();
    document.exitFullscreen();
    window.location.href = "/thankyou";
  };

  useExamGuard(
    () => setMalOpen(true),
    () => {
      if (typeof window === "undefined") return;

      alert("Multiple malpractice attempts. Test will end.");
      endTest();
    },
  );
  useFullscreenLock(() => {
    if (typeof window === "undefined") return;

    setMalOpen(true); // your warning dialog
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b shadow-sm px-8 py-4 flex justify-between items-center">
        {/* Left: Title */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Mathrix 26 — Code Matrix</h1>
          <p className="text-sm text-zinc-500">Round 1 — MCQ Test</p>
        </div>

        {/* Center: Team Info */}
        <div className="flex flex-col items-center">
          <span className="font-bold uppercase tracking-wide">
            Team {teamName}
          </span>

          <span className="text-sm text-zinc-500">
            <>
              {p1} | {p2}
            </>
          </span>
        </div>

        {/* Right: Timer + End */}
        <div className="flex items-center gap-6">
          {/* ✅ Attended count */}
          <span className="mt-1 text-lg font-semibold">
            Attended {Object.keys(answers).length} / {questions.length}
          </span>

          <Timer onTimeUp={endTest} />

          <Button
            variant="destructive"
            size="lg"
            onClick={() => setConfirm(true)}>
            End Test
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
        {questions.map((q, i) => (
          <QuestionBox
            key={i}
            q={q}
            index={i}
            answer={answers[i]}
            setAnswer={setAnswer}
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirm}
        onConfirm={endTest}
        onCancel={() => setConfirm(false)}
      />
      <MalpracticeDialog
        open={malOpen}
        strikes={strikes}
        onClose={() => setMalOpen(false)}
      />
    </div>
  );
}
