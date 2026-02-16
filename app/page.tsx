/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import ParticipantModal from "@/components/custom/ParticipantModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const checkRegistration = () => {
    const name = localStorage.getItem("teamname") || "";
    const details = localStorage.getItem("teamDetails");
    const teamid = localStorage.getItem("teamid");

    if (!teamid) {
      setShowModal(true);
    } else {
      setShowModal(false);
      setTeamName(name);
      if (details) {
        const parsed = JSON.parse(details);
        setP1(parsed.members?.[0]?.name || "");
        setP2(parsed.members?.[1]?.name || "");
      }
    }
  };

  useEffect(() => {
    checkRegistration();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center pb-20">
      {showModal && <ParticipantModal onSuccess={checkRegistration} />}

      {/* Header */}
      <div className="text-center mt-20 px-6">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic">Mathrix 26</h1>
        <div className="bg-blue-600 text-white px-4 py-1 text-xl mt-4 font-bold inline-block transform -skew-x-12">
          Code Matrix — Round 1
        </div>

        {teamName && (
          <div className="mt-8 bg-white dark:bg-zinc-900 border-2 border-black p-4 inline-block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-bold">
              Team: {teamName}
            </div>
            <div className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">
              {p1} & {p2}
            </div>
          </div>
        )}
      </div>

      {/* Rules Card */}
      <div className="mt-4 w-[95%] max-w-4xl bg-white dark:bg-zinc-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none p-12 border-4 border-black">
        <h3 className="text-3xl font-black mb-8 underline decoration-blue-600 decoration-8 underline-offset-8">
          RULES & REGULATIONS
        </h3>

        <div className="mb-10">
          <ul className="space-y-4 text-lg leading-relaxed list-disc pl-6 font-medium">
            <li>The quiz duration is <b>30 minutes</b>.</li>
            <li>Each team consists of <b>2 participants</b>.</li>
            <li>Total <b>20 MCQ questions</b> will be presented randomly.</li>
            <li>Once the quiz starts, the screen will switch to <b>fullscreen mode</b>.</li>
            <li>Do not refresh, switch tabs, or exit fullscreen during the test.</li>
            <li>All answers are auto-saved. Timer continues even after refresh.</li>
            <li>You can end the test early using the <b>End Test</b> button.</li>
            <li>Results will be evaluated automatically after submission.</li>
            <li>Any malpractice may lead to disqualification.</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link href="/quiz" className="w-full md:w-auto">
            <Button size="lg" className="w-full md:px-20 py-8 text-2xl font-black rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              START QUIZ NOW
            </Button>
          </Link>
          <p className="text-xs font-bold text-zinc-400 uppercase">Timer starts immediately after questions load</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-sm font-bold uppercase tracking-widest text-zinc-400 text-center">
        © Mathrix 2026
      </footer>
    </div>
  );
}
