/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import IntegratedIDE from "@/components/custom/IntegratedIDE";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Terminal, Home, ArrowLeft } from "lucide-react";

export default function StandaloneIDEPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col justify-between">
      {/* Top Bar */}
      <header className="bg-black border-b-4 border-zinc-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white rounded-none p-1">
              <ArrowLeft className="w-5 h-5 mr-1" /> Home
            </Button>
          </Link>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black uppercase tracking-tight">
              LocalMCQ Code Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="hidden sm:inline">Supported: Python 3 • C • C++ • Java 17 • Node.js</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <IntegratedIDE className="w-full" />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black py-4 text-center text-xs text-zinc-500 font-mono">
        LocalMCQ Sandboxed Execution Environment • Timeout: 6.0s
      </footer>
    </div>
  );
}
