"use client";
import { useEffect, useState } from "react";

const DURATION = 30 * 60 * 1000;

export default function Timer({ onTimeUp }) {
  const [time, setTime] = useState(DURATION);

  useEffect(() => {
    if (!localStorage.getItem("quiz_start")) {
      localStorage.setItem("quiz_start", Date.now().toString());
    }

    const interval = setInterval(() => {
      const start = Number(localStorage.getItem("quiz_start"));
      const remaining = DURATION - (Date.now() - start);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      } else {
        setTime(remaining);
      }
    }, 50); // smooth update for milliseconds

    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(time / 60000);
  const secs = Math.floor((time % 60000) / 1000);
  const ms = Math.floor((time % 1000) / 10);

  // 🎨 Dynamic styles
  let style = "bg-white text-black border";
  let underline = "";

  if (time <= 60 * 1000) {
    style = "bg-transparent text-red-600 border-red-600";
  } else if (time <= DURATION / 2) {
    underline = "border-b-4 border-yellow-500";
  }

  return (
    <div
      className={`px-6 py-2 rounded-full text-lg font-bold shadow border transition-all ${style} ${underline}`}
    >
      ⏱ {mins}:{secs.toString().padStart(2, "0")}:
      <span className="text-sm">{ms.toString().padStart(2, "0")}</span>
    </div>
  );
}
