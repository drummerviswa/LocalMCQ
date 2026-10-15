/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Clock,
  HelpCircle,
  ShieldAlert,
  Award,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Laptop,
  Zap,
  Sparkles,
  RotateCcw,
  FileText,
  Lock,
} from "lucide-react";

export default function ExamLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRegModal, setShowRegModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [registeredTeam, setRegisteredTeam] = useState<any>(null);

  const [participants, setParticipants] = useState<any[]>([
    { name: "", regno: "", mobileno: "", department: "", course: "", branch: "" },
  ]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exam/${slug}/info`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExam(data.exam);
          const min = data.exam.minTeamSize || 1;
          const initialParticipants = Array.from({ length: min }, () => ({
            name: "",
            regno: "",
            mobileno: "",
            department: "",
            course: "",
            branch: "",
          }));
          setParticipants(initialParticipants);
        } else {
          setError(data.message || "Exam not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load exam details");
        setLoading(false);
      });

    // Check if team is already registered for this exam in localStorage
    const savedTeamId = localStorage.getItem(`teamid_${slug}`) || localStorage.getItem("teamid");
    const savedExamSlug = localStorage.getItem("current_exam_slug");
    const savedDetails = localStorage.getItem(`teamDetails_${slug}`) || localStorage.getItem("teamDetails");

    if (savedTeamId && savedExamSlug === slug && savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        setRegisteredTeam(parsed);
      } catch { }
    }
  }, [slug]);

  const addParticipantSlot = () => {
    if (exam && participants.length < (exam.maxTeamSize || 2)) {
      setParticipants((prev) => [
        ...prev,
        { name: "", regno: "", mobileno: "", department: "", course: "", branch: "" },
      ]);
    }
  };

  const removeParticipantSlot = (index: number) => {
    if (exam && participants.length > (exam.minTeamSize || 1)) {
      setParticipants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    try {
      const res = await fetch(`/api/exam/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamname: teamName,
          accessCode: exam.requiresAccessCode ? accessCode : undefined,
          participants,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      // Store in localStorage for this exam
      localStorage.setItem(`teamid_${slug}`, data.team.id);
      localStorage.setItem(`teamDetails_${slug}`, JSON.stringify(data.team));
      localStorage.setItem("teamid", data.team.id);
      localStorage.setItem("teamname", data.team.teamname);
      localStorage.setItem("current_exam_slug", slug);

      setRegisteredTeam(data.team);
      setShowRegModal(false);
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleClearRegistration = () => {
    if (!confirm("Re-register? This will clear your current registration pass on this device.")) return;
    localStorage.removeItem(`teamid_${slug}`);
    localStorage.removeItem(`teamDetails_${slug}`);
    localStorage.removeItem("teamid");
    localStorage.removeItem("teamname");
    localStorage.removeItem("current_exam_slug");
    setRegisteredTeam(null);
    setShowRegModal(true);
  };

  const handleStartExam = () => {
    router.push(`/exam/${slug}/quiz`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin mx-auto" />
          <div className="text-xl font-black uppercase tracking-tight">Loading Assessment Portal...</div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Verifying contest security tokens</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-black uppercase mb-2">Contest Unavailable</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 font-medium text-sm">
            {error || "This contest link does not exist or has been removed."}
          </p>
          <Button onClick={() => router.push("/")} className="w-full font-black uppercase border-2 border-black rounded-none">
            Return to Arena Home
          </Button>
        </div>
      </div>
    );
  }

  const isClosed = exam.status === "ENDED";
  const isDraft = exam.status === "DRAFT";
  const isCoding = exam.type === "CODING";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between select-none">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b-4 border-black px-4 sm:px-8 py-3.5 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="bg-black text-white px-2.5 py-1 font-black text-lg uppercase tracking-tight hover:bg-zinc-800">
            LocalMCQ
          </Link>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 hidden sm:inline">
            Symposium Portal
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCoding && (
            <Link href="/ide" target="_blank">
              <Button variant="outline" size="sm" className="hidden sm:flex font-black text-xs uppercase border-2 border-black rounded-none bg-zinc-950 text-emerald-400 hover:bg-black">
                <Terminal className="w-3.5 h-3.5 mr-1" /> Open IDE
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline" size="sm" className="font-bold text-xs uppercase border-2 border-black rounded-none">
              All Contests
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Hero & Onboarding Container */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col items-center">
        {/* Contest Header Badge & Title */}
        <div className="text-center max-w-3xl w-full mt-4 sm:mt-6 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className={`px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              isCoding ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
            }`}>
              {isCoding ? "💻 Coding Arena Contest" : "📝 Technical MCQ Arena"}
            </span>
            <span className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              exam.status === "LIVE"
                ? "bg-emerald-400 text-black"
                : exam.status === "DRAFT"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-300 text-black"
            }`}>
              {exam.status === "LIVE" ? "● LIVE CONTEST" : exam.status}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase italic text-zinc-900 dark:text-white mb-3">
            {exam.title}
          </h1>

          {exam.description && (
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
              {exam.description}
            </p>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border-2 border-black p-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <div className="text-[10px] font-black uppercase text-zinc-400">Duration</div>
              <div className="font-black text-sm">{exam.durationMinutes} Mins</div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black p-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {isCoding ? (
                <Code2 className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              ) : (
                <HelpCircle className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              )}
              <div className="text-[10px] font-black uppercase text-zinc-400">
                {isCoding ? "Challenges" : "Questions"}
              </div>
              <div className="font-black text-sm">
                {isCoding ? `${exam._count?.problems || 0} Problems` : `${exam.totalQuestionsToAsk} MCQs`}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black p-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Users className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <div className="text-[10px] font-black uppercase text-zinc-400">Team Format</div>
              <div className="font-black text-sm">
                {exam.minTeamSize === exam.maxTeamSize && exam.maxTeamSize === 1
                  ? "Solo (1 Player)"
                  : `${exam.minTeamSize}-${exam.maxTeamSize} Players`}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-black p-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
              <div className="text-[10px] font-black uppercase text-zinc-400">Proctoring</div>
              <div className="font-black text-sm">Fullscreen</div>
            </div>
          </div>
        </div>

        {/* ================= ONBOARDING STEP CARDS ================= */}
        <div className="w-full space-y-6">
          {/* Card 1: Registered Boarding Pass (if already registered) */}
          {registeredTeam ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-0.5 text-xs font-black uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Official Boarding Pass Issued
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-emerald-950 dark:text-emerald-100">
                  {registeredTeam.teamname}
                </h2>
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold mt-1 space-y-0.5">
                  <div>
                    Participants:{" "}
                    <b>{registeredTeam.members?.map((m: any) => m.name).join(" & ") || "Candidate"}</b>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    Registration ID: #{registeredTeam.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={handleStartExam}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-lg px-8 py-7 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {isCoding ? "Enter Coding Arena" : "Start MCQ Quiz"} <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearRegistration}
                  className="font-bold text-xs uppercase border-2 border-black rounded-none text-zinc-600 hover:bg-red-50 hover:text-red-600"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-register
                </Button>
              </div>
            </div>
          ) : (
            /* Registration Callout when NOT registered */
            <div className="bg-white dark:bg-zinc-900 border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="bg-blue-600 text-white px-2.5 py-0.5 text-xs font-black uppercase">
                  Step 1 of 2: Candidate Onboarding
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight mt-2">
                  Register Your Team to Begin
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                  Provide your team details and register your participants to generate your secure contest token.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setShowRegModal(true)}
                disabled={isClosed || isDraft}
                className="w-full md:w-auto px-8 py-7 text-lg font-black uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-blue-600 hover:bg-blue-700 text-white hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0 flex items-center justify-center gap-2"
              >
                Register & Board Arena <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Card 2: Environment & Rules Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-2 border-b-2 border-black pb-3">
              <Award className="w-6 h-6 text-yellow-500" />
              Contest Guidelines & Proctoring Rules
            </h3>

            {isCoding ? (
              /* Coding Arena Environment Details */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-medium">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Laptop className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Monaco Editor Environment</b>
                      <p className="text-xs text-zinc-500">
                        Full-featured IDE with syntax highlighting, automatic indentation, and code reset options.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Terminal className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">5 Compilers Supported</b>
                      <p className="text-xs text-zinc-500">
                        Code in <b>Python 3.14</b>, <b>C++ (g++)</b>, <b>C (gcc)</b>, <b>Java 17 (JDK)</b>, or <b>Node.js</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Instant Sample Runner</b>
                      <p className="text-xs text-zinc-500">
                        Test your code against sample test cases and inspect output before final submission.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Strict Fullscreen Proctoring</b>
                      <p className="text-xs text-zinc-500">
                        Leaving fullscreen or switching browser tabs logs a strike. 3 strikes result in disqualification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">4-Factor Tie-Breaking</b>
                      <p className="text-xs text-zinc-500">
                        Rank = Score → Test Cases Passed → Completion Time → Submission Attempts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Server Auto-Sync</b>
                      <p className="text-xs text-zinc-500">
                        Every submission is evaluated against visible and hidden test cases and saved immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* MCQ Arena Environment Details */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-medium">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Countdown Timer</b>
                      <p className="text-xs text-zinc-500">
                        Strict {exam.durationMinutes} minutes duration. Timer runs continuously without pausing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Dynamic Question Bank</b>
                      <p className="text-xs text-zinc-500">
                        {exam.totalQuestionsToAsk} randomized questions served dynamically with live option selection.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Fullscreen Enforcement</b>
                      <p className="text-xs text-zinc-500">
                        Tab changes, window blurring, or dev tools trigger strikes. 3 strikes disqualify the team.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                    <div>
                      <b className="text-zinc-900 dark:text-white block font-bold">Auto-Save State</b>
                      <p className="text-xs text-zinc-500">
                        All selected answers are automatically synced with the server in real time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= REGISTRATION MODAL ================= */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-4 sm:p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center">
              Candidate Registration
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-5 mt-2">
            {/* Team / Identifier */}
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-xs font-black uppercase mb-1 block">
                {exam.maxTeamSize === 1 ? "Candidate / Roll Identifier" : "Team Name"}
              </Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={exam.maxTeamSize === 1 ? "e.g. John Doe / 21CS045" : "e.g. Code Matrix Titans"}
                required
                className="font-bold rounded-none border-2 border-black bg-white dark:bg-zinc-900 text-sm"
              />
            </div>

            {/* Access PIN if required */}
            {exam.requiresAccessCode && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Label className="text-xs font-black uppercase mb-1 block text-yellow-800 dark:text-yellow-300">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Contest Access Code / PIN
                </Label>
                <Input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code provided by symposium organizers"
                  required
                  className="font-mono text-sm rounded-none border-2 border-black bg-white dark:bg-zinc-900"
                />
              </div>
            )}

            {/* Participants Slots */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-zinc-500">
                Participant Details ({participants.length} of max {exam.maxTeamSize || 2}):
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((p, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
                    <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                      <span className="font-black text-xs uppercase text-zinc-800 dark:text-zinc-200">
                        Participant #{idx + 1}
                      </span>
                      {participants.length > (exam.minTeamSize || 1) && (
                        <button
                          type="button"
                          onClick={() => removeParticipantSlot(idx)}
                          className="text-xs text-red-600 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold uppercase text-zinc-500">Full Name</Label>
                      <Input
                        value={p.name}
                        onChange={(e) => updateParticipant(idx, "name", e.target.value)}
                        required
                        placeholder="e.g. Ramesh Kumar"
                        className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Reg / Roll No</Label>
                        <Input
                          value={p.regno}
                          onChange={(e) => updateParticipant(idx, "regno", e.target.value)}
                          required
                          placeholder="e.g. 21CS101"
                          className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Mobile Number</Label>
                        <Input
                          value={p.mobileno}
                          onChange={(e) => updateParticipant(idx, "mobileno", e.target.value)}
                          required
                          placeholder="e.g. 9876543210"
                          className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Dept</Label>
                        <Input
                          value={p.department}
                          onChange={(e) => updateParticipant(idx, "department", e.target.value)}
                          required
                          placeholder="CSE"
                          className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Course</Label>
                        <Input
                          value={p.course}
                          onChange={(e) => updateParticipant(idx, "course", e.target.value)}
                          required
                          placeholder="B.Tech"
                          className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Branch</Label>
                        <Input
                          value={p.branch}
                          onChange={(e) => updateParticipant(idx, "branch", e.target.value)}
                          required
                          placeholder="AI-DS"
                          className="border border-zinc-400 rounded-none bg-white dark:bg-zinc-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {participants.length < (exam.maxTeamSize || 2) && (
              <Button
                type="button"
                variant="outline"
                onClick={addParticipantSlot}
                className="w-full border-2 border-dashed border-black font-bold uppercase text-xs py-2 rounded-none hover:bg-zinc-100"
              >
                + Add Another Participant Slot
              </Button>
            )}

            {regError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs text-center">
                {regError}
              </div>
            )}

            <Button
              type="submit"
              disabled={regLoading}
              className="w-full py-6 text-lg font-black uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black text-white hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              {regLoading ? "Registering Team..." : "Confirm & Issue Boarding Pass"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t-2 border-zinc-200 dark:border-zinc-800 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
        LocalMCQ Contest Platform • College Symposium Edition
      </footer>
    </div>
  );
}
