/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import ParticipantModal from "@/components/custom/ParticipantModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [part] = useState(true);

  const [teamName, setTeamName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("teamname") || "";
    const details = localStorage.getItem("teamDetails");

    setTeamName(name);

    if (details) {
      const parsed = JSON.parse(details);
      setP1(parsed.members[0]?.name || "");
      setP2(parsed.members[1]?.name || "");
    }
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-100 dark:from-black dark:to-zinc-900 flex flex-col items-center">
      {part && <ParticipantModal />}

      {/* Header */}
      <div className="text-center mt-20">
        <h1 className="text-5xl font-extrabold tracking-tight">Mathrix 26</h1>
        <h2 className="text-2xl mt-2 text-blue-600 font-semibold">
          Code Matrix — Round 1
        </h2>
        {teamName && (
          <>
            <div className="mt-4 text-xl font-semibold">
              Welcome Team {teamName} 👋🏻
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {p1} — {p2}
            </div>
          </>
        )}
      </div>

      {/* Rules Card */}
      <div className="mt-12 w-[90%] max-w-4xl bg-white dark:bg-zinc-900 shadow-xl rounded-xl p-10 border">
        <h3 className="text-2xl font-bold mb-6 text-center">
          Rules & Regulations
        </h3>

        <ul className="space-y-4 text-lg leading-relaxed list-disc pl-6">
          <li>
            The quiz duration is <b>30 minutes</b>.
          </li>
          <li>
            Each team consists of <b>2 participants</b>.
          </li>
          <li>
            Total <b>20 MCQ questions</b> will be presented randomly.
          </li>
          <li>
            Once the quiz starts, the screen will switch to{" "}
            <b>fullscreen mode</b>.
          </li>
          <li>
            Do not refresh, switch tabs, or exit fullscreen during the test.
          </li>
          <li>
            All answers are auto-saved. Timer continues even after refresh.
          </li>
          <li>
            You can end the test early using the <b>End Test</b> button.
          </li>
          <li>Results will be evaluated automatically after submission.</li>
          <li>Any malpractice may lead to disqualification.</li>
        </ul>

        <div className="flex justify-center mt-10">
          <Link href="/quiz">
            <Button size="lg" className="px-12 py-6 text-lg">
              Start Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 mb-6 text-sm text-zinc-500 text-center">
        If there are any issues, please contact the administrator.
      </footer>
    </div>
  );
}
