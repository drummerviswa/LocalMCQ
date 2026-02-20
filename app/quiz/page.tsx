/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import QuestionBox from "@/components/custom/QuestionBox";
import { Button } from "@/components/ui/button";
import useProctorGuard from "@/helper/useProctorGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const EXAM_DURATION = 15 * 60 * 1000; // 15 mins

export default function QuizPage() {
  const [teamid, setTeamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(EXAM_DURATION);
  const [startTime, setStartTime] = useState<number>(0);
  const [strikes, setStrikes] = useState<number>(0);
  const [disqualified, setDisqualified] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const tid = localStorage.getItem("teamid");
    if (!tid) {
      window.location.href = "/";
      return;
    }
    setTeamId(tid);

    // Load local answers if they exist (for persistence across refresh)
    const localAns = localStorage.getItem("quiz_answers");
    if (localAns) {
      try {
        setAnswers(JSON.parse(localAns));
      } catch (e) { }
    }
  }, []);

  useProctorGuard(
    (loaded && teamid) ? teamid : "",
    (newStrikes) => {
      setStrikes(newStrikes);
      setShowWarning(true);
    },
    () => {
      setDisqualified(true);
    }
  );

  // 🚨 Clear storage immediately upon disqualification
  useEffect(() => {
    if (disqualified) {
      localStorage.clear();
      sessionStorage.clear();
    }
  }, [disqualified]);

  // ▶️ Start Quiz
  useEffect(() => {
    if (!teamid) return;

    fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamid }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success === false) {
          console.error("Failed to start quiz:", data.message);
          return;
        }
        setQuestions(data.questions);

        // If startTime is not set, it's the first time - start it now!
        if (!data.startTime) {
          const startRes = await fetch("/api/quiz/timer/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamid }),
          });
          const startData = await startRes.json();
          setStartTime(Number(startData.startTime));
        } else {
          setStartTime(Number(data.startTime));
        }

        setLoaded(true);
      })
      .catch((err) => {
        console.error("Error starting quiz:", err);
      });
  }, [teamid]);

  // ⏱ High Precision Timer (mm:ss:ms) - Only start when LOADED
  useEffect(() => {
    if (!startTime || disqualified || !loaded) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = EXAM_DURATION - elapsed;

      if (left <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        endTest(true); // Auto-submit
      } else {
        setTimeLeft(left);
      }
    }, 10); // Update every 10ms for smooth ms display

    return () => clearInterval(interval);
  }, [startTime, disqualified, loaded]);

  const setAnswer = (qid: string, val: string) => {
    if (disqualified) return;

    // Update local state and storage for persistence
    const newAnswers = { ...answers, [qid]: val };
    setAnswers(newAnswers);
    localStorage.setItem("quiz_answers", JSON.stringify(newAnswers));

    fetch("/api/quiz/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamid, qid, answer: val }),
    }).catch((err) => {
      console.error("Error saving answer:", err);
    });
  };

  const endTest = async (auto = false) => {
    if (!teamid) return;
    localStorage.setItem("quiz_ending", "true");

    try {
      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamid }),
      });

      // Clear all local preferences for next user
      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/thankyou";
    } catch (err) {
      console.error("Error submitting quiz:", err);
      localStorage.clear();
      window.location.href = "/thankyou";
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const msecs = ms % 1000;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s ${msecs.toString().padStart(3, '0')}ms`;
  };

  const isLastMinute = timeLeft <= 60000;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length || 20;

  if (disqualified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-2xl border-2 border-red-500">
          <h1 className="text-4xl font-extrabold text-red-600 mb-4">DISQUALIFIED</h1>
          <p className="text-lg text-zinc-700 mb-6">
            Multiple malpractice attempts were detected. Your access has been revoked and this instance has been reported to the admin.
          </p>
          <Button variant="outline" onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
          }}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 select-none">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black bg-black text-white px-3 py-1 rounded">LocalMCQ</h1>
          <div className={`text-2xl font-mono p-1 rounded min-w-[140px] text-center ${isLastMinute ? "text-red-500 animate-pulse bg-red-50" : "text-black"}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Progress</span>
            <span className="text-xl font-black text-black">
              {answeredCount} <span className="text-zinc-400 text-sm font-medium">/ {totalQuestions}</span>
            </span>
          </div>
          <Button variant="destructive" className="font-bold px-6" onClick={() => setShowEndConfirm(true)}>
            End Quiz
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
        {questions.length === 0 ? (
          <div className="flex justify-center py-20 text-zinc-400">Loading your personalized quiz...</div>
        ) : (
          questions.map((q, i) => (
            <QuestionBox
              key={q.id}
              q={q}
              index={i}
              answer={answers[q.id]}
              setAnswer={(val: string) => setAnswer(q.id, val)}
            />
          ))
        )}
      </div>

      {/* Malpractice Warning */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-md border-4 border-red-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">MALPRACTICE WARNING!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-zinc-700 font-medium mb-4">
              A violation (tab switch or fullscreen exit) was detected.
            </p>
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <span className="text-sm uppercase font-bold text-red-800">Current Strikes</span>
              <div className="text-5xl font-black text-red-600">{strikes} / 3</div>
            </div>
            <p className="text-sm text-red-500 font-bold">
              CAUTION: Reaching 3 strikes will result in immediate disqualification.
            </p>
          </div>
          <Button onClick={() => setShowWarning(false)} className="w-full bg-red-600 hover:bg-red-700">
            I Understand, Continue Test
          </Button>
        </DialogContent>
      </Dialog>

      {/* End Confirm */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to end the quiz?</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-zinc-600">
            You will not be able to return to the quiz once submitted. Please ensure all questions are answered.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => endTest(false)}>Yes, Submit Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
