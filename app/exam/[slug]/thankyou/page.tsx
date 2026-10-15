/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy, Home, Clock } from "lucide-react";
import Link from "next/link";

export default function ExamThankYouPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`latest_score_${slug}`);
    if (raw) {
      try {
        setScoreData(JSON.parse(raw));
      } catch { }
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 border-4 border-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tight mb-2 text-zinc-900 dark:text-white">
          Submission Received!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-8">
          Your answers have been securely evaluated and recorded on the server.
        </p>

        {/* Score Card if enabled */}
        {scoreData && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
            <div className="flex items-center justify-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-black text-sm uppercase">
              <Trophy className="w-4 h-4 text-yellow-500" /> Assessment Result
            </div>
            <div className="text-5xl font-black text-blue-900 dark:text-blue-200">
              {scoreData.score}{" "}
              <span className="text-xl text-blue-500 font-bold">
                / {scoreData.totalPossible || 20}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-2 uppercase">
              Points Scored
            </p>
          </div>
        )}

        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-black mb-8 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Official rankings and qualifiers will be published on the main symposium leaderboard.
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/exam/${slug}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-2 border-black rounded-none font-bold py-6">
              Exam Details
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full bg-black text-white hover:bg-zinc-800 border-2 border-black rounded-none font-black py-6">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
