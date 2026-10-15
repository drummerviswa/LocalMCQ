/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Code2,
  Terminal,
  Search,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "CODING" | "MCQ">("ALL");
  const [quickSlug, setQuickSlug] = useState("");

  useEffect(() => {
    fetch("/api/exams/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSlug.trim()) return;
    const clean = quickSlug.trim().toLowerCase().replace(/^\/exam\//, "");
    router.push(`/exam/${clean}`);
  };

  const filteredExams = exams.filter((ex) => {
    if (filterType === "CODING") return ex.type === "CODING";
    if (filterType === "MCQ") return ex.type !== "CODING";
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b-4 border-black px-4 sm:px-8 py-3.5 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <span className="bg-black text-white px-2.5 py-1 font-black text-lg uppercase tracking-tight">
            LocalMCQ
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 hidden sm:inline">
            Symposium Contest Platform
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/ide">
            <Button
              variant="outline"
              size="sm"
              className="font-black text-xs uppercase border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-zinc-950 text-emerald-400 hover:bg-black hover:text-emerald-300"
            >
              <Terminal className="w-3.5 h-3.5 mr-1" /> Code Studio
            </Button>
          </Link>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="font-black text-xs uppercase border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Admin Portal
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-10 flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl w-full mt-4 sm:mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" /> Live Assessments Portal
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase italic text-zinc-900 dark:text-white mb-3">
            Online Contest Arena
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl mx-auto mb-6">
            Compete in proctored MCQ exams and real-time coding competitions evaluated with Monaco Editor and local compilers.
          </p>

          {/* Quick Direct Link Join Bar */}
          <form
            onSubmit={handleQuickJoin}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <Input
                value={quickSlug}
                onChange={(e) => setQuickSlug(e.target.value)}
                placeholder="Enter event slug (e.g. code-matrix)"
                className="pl-9 pr-3 py-2 border-2 border-black rounded-none font-bold text-xs bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto font-black uppercase rounded-none border-2 border-black bg-black text-white text-xs px-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-800"
            >
              Join Arena <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>
        </div>

        {/* Filter Pills */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 font-black text-xs uppercase border-2 transition-all ${
                filterType === "ALL"
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white dark:bg-zinc-900 border-zinc-300 text-zinc-600 hover:border-black"
              }`}
            >
              All Events ({exams.length})
            </button>
            <button
              onClick={() => setFilterType("CODING")}
              className={`px-3 py-1 font-black text-xs uppercase border-2 transition-all flex items-center gap-1 ${
                filterType === "CODING"
                  ? "bg-purple-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white dark:bg-zinc-900 border-zinc-300 text-zinc-600 hover:border-black"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Coding Contests ({exams.filter((e) => e.type === "CODING").length})
            </button>
            <button
              onClick={() => setFilterType("MCQ")}
              className={`px-3 py-1 font-black text-xs uppercase border-2 transition-all flex items-center gap-1 ${
                filterType === "MCQ"
                  ? "bg-blue-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white dark:bg-zinc-900 border-zinc-300 text-zinc-600 hover:border-black"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> MCQ Quizzes ({exams.filter((e) => e.type !== "CODING").length})
            </button>
          </div>

          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {filteredExams.length} active contest{filteredExams.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Available Exams Grid */}
        {loading ? (
          <div className="py-20 text-center font-bold animate-pulse text-zinc-400">
            Checking active contests...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-4 border-black p-8 sm:p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">Ready to Host Contests!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 font-medium text-sm">
              {filterType === "ALL"
                ? "No live exams created yet. Head over to the Admin Portal to create your first exam and generate test links."
                : `No ${filterType === "CODING" ? "coding contests" : "MCQ exams"} match your filter.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin">
                <Button className="font-black uppercase rounded-none border-2 border-black bg-black text-white px-6 py-5">
                  Open Admin Portal
                </Button>
              </Link>
              {filterType !== "ALL" && (
                <Button
                  variant="outline"
                  onClick={() => setFilterType("ALL")}
                  className="font-bold uppercase rounded-none border-2 border-black px-6 py-5"
                >
                  View All Contests
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-zinc-900 border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                          ex.status === "LIVE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                            : "bg-zinc-200 text-zinc-700 border-zinc-400"
                        }`}
                      >
                        {ex.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                          ex.type === "CODING"
                            ? "bg-purple-100 text-purple-900 border-purple-500"
                            : "bg-blue-100 text-blue-900 border-blue-500"
                        }`}
                      >
                        {ex.type === "CODING" ? "💻 Coding" : "📝 MCQ"}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-zinc-400">
                      {ex._count?.teams || 0} teams
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black uppercase mb-1.5 text-zinc-900 dark:text-white line-clamp-1">
                    {ex.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium line-clamp-2 mb-5">
                    {ex.description || "Participate and test your technical skills."}
                  </p>

                  <div className="space-y-1.5 mb-5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Duration:
                      </span>
                      <span>{ex.durationMinutes} Mins</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        {ex.type === "CODING" ? (
                          <Code2 className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {ex.type === "CODING" ? "Challenges:" : "Questions:"}
                      </span>
                      <span className="font-bold">
                        {ex.type === "CODING"
                          ? `${ex._count?.problems || 0} Problems`
                          : `${ex.totalQuestionsToAsk} MCQs`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-500" /> Team Size:
                      </span>
                      <span>
                        {ex.minTeamSize === ex.maxTeamSize && ex.maxTeamSize === 1
                          ? "Solo (1 Player)"
                          : `${ex.minTeamSize}-${ex.maxTeamSize} Players`}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href={`/exam/${ex.slug}`}>
                  <Button
                    disabled={ex.status === "ENDED"}
                    className={`w-full font-black uppercase rounded-none border-2 border-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] py-5 flex items-center justify-center gap-2 ${
                      ex.type === "CODING"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {ex.status === "ENDED" ? "Concluded" : "Enter Contest"} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white dark:bg-zinc-900 py-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
        LocalMCQ • Symposium Online Assessment Suite
      </footer>
    </div>
  );
}
