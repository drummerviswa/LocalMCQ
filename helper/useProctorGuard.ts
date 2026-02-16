/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";

export default function useProctorGuard(
  teamid: string,
  onStrike: (strikes: number) => void,
  onDisqualify: () => void
) {
  useEffect(() => {
    if (!teamid) return;

    let isRegistering = false;

    const isEnding = () =>
      localStorage.getItem("quiz_ending") === "true";

    const enterFS = async () => {
      if (!document.fullscreenElement && !isEnding()) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error("Fullscreen request failed", err);
        }
      }
    };

    const registerStrike = async () => {
      if (isEnding() || isRegistering) return;
      isRegistering = true;

      try {
        const res = await fetch("/api/quiz/strike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamid }),
        });
        const data = await res.json();

        if (data.success) {
          if (data.disqualified) {
            onDisqualify();
          } else {
            onStrike(data.strikes);
          }
        }
      } catch (err) {
        console.error("Failed to register strike", err);
      } finally {
        isRegistering = false;
        // Re-force fullscreen after strike
        setTimeout(enterFS, 500);
      }
    };

    // Initial fullscreen
    enterFS();

    // ❌ Copy / select / right click
    const prevent = (e: any) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    // ❌ Dev keys
    const keyHandler = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        registerStrike();
      }
    };
    window.addEventListener("keydown", keyHandler);

    // ❌ Fullscreen exit (ESC)
    const fsHandler = () => {
      if (!document.fullscreenElement && !isEnding()) {
        registerStrike();
      }
    };
    document.addEventListener("fullscreenchange", fsHandler);

    // ❌ Tab / app switch
    const visHandler = () => {
      if (document.hidden && !isEnding()) {
        registerStrike();
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    // ❌ Devtools open detection
    const devInterval = setInterval(() => {
      if (isEnding()) return;
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        registerStrike();
      }
    }, 2000);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      window.removeEventListener("keydown", keyHandler);
      document.removeEventListener("fullscreenchange", fsHandler);
      document.removeEventListener("visibilitychange", visHandler);
      clearInterval(devInterval);
    };
  }, [teamid, onStrike, onDisqualify]);
}
