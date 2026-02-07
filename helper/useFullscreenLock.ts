"use client";
import { useEffect } from "react";

export default function useFullscreenLock(onViolation: () => void) {
  useEffect(() => {
    const enterFS = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {}
      }
    };

    // Always enter on load
    enterFS();

    // If user exits → re-enter + violation
    const fsHandler = () => {
      if (!document.fullscreenElement) {
        onViolation();
        setTimeout(enterFS, 300);
      }
    };
    document.addEventListener("fullscreenchange", fsHandler);

    // If user switches tab/app → re-enter + violation
    const visHandler = () => {
      if (document.hidden) {
        onViolation();
        setTimeout(enterFS, 300);
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      document.removeEventListener("fullscreenchange", fsHandler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, []);
}
