"use client";
import { useEffect } from "react";

export default function useExamGuard(
  onStrike: () => void,
  onDisqualify: () => void,
) {
  useEffect(() => {
    let strikes = Number(localStorage.getItem("mal_strikes") || "0");

    const registerStrike = () => {
      strikes += 1;
      localStorage.setItem("mal_strikes", strikes.toString());

      if (strikes > 2) {
        onDisqualify();
      } else {
        onStrike();
      }
    };

    const prevent = (e: any) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

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

    const fsHandler = () => {
      if (!document.fullscreenElement) {
        registerStrike(); // warning
        setTimeout(() => {
          document.documentElement.requestFullscreen();
        }, 300);
      }
    };
    document.addEventListener("fullscreenchange", fsHandler);

    const visHandler = () => {
      if (document.hidden) registerStrike();
    };
    document.addEventListener("visibilitychange", visHandler);

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
