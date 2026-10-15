/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Trophy, Clock, Users, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectorLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [exam, setExam] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchResults = () => {
    // 1. Get exam info
    fetch(`/api/exam/${slug}/info`)
      .then((res) => res.json())
      .then((infoData) => {
        if (infoData.success) {
          setExam(infoData.exam);
          // 2. Fetch results for this exam ID
          return fetch(`/api/admin/exams/${infoData.exam.id}/results`);
        }
        throw new Error("Exam not found");
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.teams)) {
          setTeams(data.teams);
          setLastUpdated(new Date().toLocaleTimeString());
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Projector fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResults();
    // Auto-refresh every 8 seconds for real-time projection
    const interval = setInterval(fetchResults, 8000);
    return () => clearInterval(interval);
  }, [slug]);

  const isCoding = exam?.type === "CODING";

  const eligibleTeams = teams
    .filter((t) => !t.disqualified && (t.endTime || (t.submissions && t.submissions.length > 0) || t.startTime))
    .sort((a, b) => {
      if (isCoding) {
        if (b.codingScore !== a.codingScore) return b.codingScore - a.codingScore;
        if (b.totalPassedCases !== a.totalPassedCases) return b.totalPassedCases - a.totalPassedCases;
        const penA = a.penaltyTime ? Number(a.penaltyTime) : 999999;
        const penB = b.penaltyTime ? Number(b.penaltyTime) : 999999;
        if (penA !== penB) return penA - penB;
        return (a.submissionCount || 0) - (b.submissionCount || 0);
      } else {
        if (b.quizscore !== a.quizscore) return b.quizscore - a.quizscore;
        const timeA = a.endTime && a.startTime ? Number(a.endTime) - Number(a.startTime) : 999999;
        const timeB = b.endTime && b.startTime ? Number(b.endTime) - Number(b.startTime) : 999999;
        return timeA - timeB;
      }
    });

  const formatTime = (start: number, end: number) => {
    if (!start || !end) return "—";
    const ms = end - start;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const top3 = eligibleTeams.slice(0, 3);
  const restTop = eligibleTeams.slice(3, 10);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10 select-none flex flex-col justify-between font-sans">
      {/* Top Banner */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 uppercase tracking-widest">
                Stage Projector Mode
              </span>
              <span className="text-zinc-500 text-xs font-mono">
                Auto-syncs every 8s • Last update: {lastUpdated || "Connecting..."}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              {exam?.title || "Live Symposium Assessment"}
            </h1>
          </div>

          <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 px-6 py-3">
            <div>
              <span className="text-zinc-500 text-xs uppercase font-bold block">Submissions</span>
              <span className="text-2xl font-black text-emerald-400">{eligibleTeams.length}</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div>
              <span className="text-zinc-500 text-xs uppercase font-bold block">Total Registered</span>
              <span className="text-2xl font-black text-white">{teams.length}</span>
            </div>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-5xl mx-auto">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="bg-zinc-900 border-2 border-zinc-400 p-6 flex flex-col items-center justify-between text-center relative order-2 md:order-1 mt-6">
                <span className="absolute -top-4 bg-zinc-300 text-black font-black px-4 py-1 text-sm uppercase">
                  Rank 2 • Silver
                </span>
                <div className="mt-4">
                  <h3 className="text-2xl font-black text-white">{top3[1].teamname}</h3>
                  <p className="text-xs text-zinc-400 mt-1 uppercase font-bold">
                    {top3[1].members?.map((m: any) => m.name).join(" & ")}
                  </p>
                </div>
                <div className="mt-6">
                  <div className="text-4xl font-black text-zinc-300">
                    {isCoding ? top3[1].codingScore : top3[1].quizscore} Pts
                  </div>
                  {isCoding && (
                    <div className="text-xs text-emerald-400 font-mono mt-0.5">
                      ✓ {top3[1].totalPassedCases || 0} Cases Passed
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    ⏱ {formatTime(Number(top3[1].startTime), Number(top3[1].endTime))}
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="bg-gradient-to-b from-yellow-950/40 to-zinc-900 border-4 border-yellow-500 p-8 flex flex-col items-center justify-between text-center relative order-1 md:order-2 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <span className="absolute -top-5 bg-yellow-400 text-black font-black px-6 py-1.5 text-base uppercase tracking-wider flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-4 h-4" /> Champion • 1st Place
                </span>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-yellow-300">{top3[0].teamname}</h3>
                  <p className="text-xs text-yellow-200/80 mt-1 uppercase font-bold">
                    {top3[0].members?.map((m: any) => m.name).join(" & ")}
                  </p>
                </div>
                <div className="mt-6">
                  <div className="text-6xl font-black text-yellow-400">
                    {isCoding ? top3[0].codingScore : top3[0].quizscore} Pts
                  </div>
                  {isCoding && (
                    <div className="text-sm text-yellow-300 font-mono mt-1 font-bold">
                      ✓ {top3[0].totalPassedCases || 0} Cases Passed
                    </div>
                  )}
                  <div className="text-sm text-yellow-300/80 font-mono mt-1 font-bold">
                    ⏱ {formatTime(Number(top3[0].startTime), Number(top3[0].endTime))}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="bg-zinc-900 border-2 border-amber-700 p-6 flex flex-col items-center justify-between text-center relative order-3 mt-6">
                <span className="absolute -top-4 bg-amber-700 text-white font-black px-4 py-1 text-sm uppercase">
                  Rank 3 • Bronze
                </span>
                <div className="mt-4">
                  <h3 className="text-2xl font-black text-white">{top3[2].teamname}</h3>
                  <p className="text-xs text-zinc-400 mt-1 uppercase font-bold">
                    {top3[2].members?.map((m: any) => m.name).join(" & ")}
                  </p>
                </div>
                <div className="mt-6">
                  <div className="text-4xl font-black text-amber-500">
                    {isCoding ? top3[2].codingScore : top3[2].quizscore} Pts
                  </div>
                  {isCoding && (
                    <div className="text-xs text-emerald-400 font-mono mt-0.5">
                      ✓ {top3[2].totalPassedCases || 0} Cases Passed
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    ⏱ {formatTime(Number(top3[2].startTime), Number(top3[2].endTime))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top 4-10 Leaderboard Table */}
        {restTop.length > 0 && (
          <div className="max-w-5xl mx-auto w-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="bg-zinc-800/80 px-6 py-3 font-black text-sm uppercase tracking-wider text-zinc-300 flex justify-between">
              <span>Top Contenders (Ranks 4 - 10)</span>
              <span>Sorted by Score, Test Cases Passed & Completion Speed</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-xs">
                <tr>
                  <th className="p-3 pl-6">Rank</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Participants</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 pr-6 text-right">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {restTop.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-zinc-800/50">
                    <td className="p-3 pl-6 font-bold text-zinc-400">#{idx + 4}</td>
                    <td className="p-3 font-black text-white text-base">{team.teamname}</td>
                    <td className="p-3 text-xs text-zinc-400">
                      {team.members?.map((m: any) => m.name).join(", ")}
                    </td>
                    <td className="p-3 text-right font-black text-blue-400 text-lg">
                      {isCoding ? team.codingScore : team.quizscore} Pts
                      {isCoding && (
                        <span className="block text-[11px] text-zinc-400 font-normal">
                          {team.totalPassedCases || 0} test cases
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-6 text-right font-mono text-zinc-400 text-xs">
                      {formatTime(Number(team.startTime), Number(team.endTime))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {eligibleTeams.length === 0 && (
          <div className="text-center py-20 text-zinc-500 font-medium italic">
            Waiting for participants to complete the exam... Results will populate live on this board!
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-zinc-800 pt-4 flex justify-between items-center text-xs text-zinc-500 font-bold uppercase tracking-widest">
        <span>LocalMCQ Live Stage Engine</span>
        <span>Mathrix Symposium 2026</span>
      </footer>
    </div>
  );
}
