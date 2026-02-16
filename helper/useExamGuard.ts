/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";

export default function useExamGuard(teamid: string) {
  useEffect(() => {
    const strike = () => {
      fetch("/api/quiz/strike", {
        method: "POST",
        body: JSON.stringify({ teamid }),
      });
    };

    const vis = () => document.hidden && strike();
    const fs = () => !document.fullscreenElement && strike();

    document.addEventListener("visibilitychange", vis);
    document.addEventListener("fullscreenchange", fs);

    return () => {
      document.removeEventListener("visibilitychange", vis);
      document.removeEventListener("fullscreenchange", fs);
    };
  }, [teamid]);
}
