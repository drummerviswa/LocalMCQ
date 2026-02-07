/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";

export default function useProctorGuard(
  onStrike: () => void,
  onDisqualify: () => void
) {
  useEffect(() => {
    let strikes = Number(localStorage.getItem("mal_strikes") || "0");

    const isEnding = () =>
      localStorage.getItem("quiz_ending") === "true";

    const enterFS = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {}
      }
    };

    const registerStrike = () => {
      if (isEnding()) return;

      strikes += 1;
      localStorage.setItem("mal_strikes", strikes.toString());

      if (strikes > 2) onDisqualify();
      else onStrike();
    };

    // Always force fullscreen
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
      if (!document.fullscreenElement) {
        registerStrike();
        setTimeout(enterFS, 200);
      }
    };
    document.addEventListener("fullscreenchange", fsHandler);

    // ❌ Tab / app switch
    const visHandler = () => {
      if (document.hidden) {
        registerStrike();
        setTimeout(enterFS, 200);
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    // ❌ Devtools open detection
    const devInterval = setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        registerStrike();
      }
    }, 1000);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      window.removeEventListener("keydown", keyHandler);
      document.removeEventListener("fullscreenchange", fsHandler);
      document.removeEventListener("visibilitychange", visHandler);
      clearInterval(devInterval);
    };
  }, []);
}
