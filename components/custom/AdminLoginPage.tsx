/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, UserPlus, LogIn, KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage({
  onLogin,
}: {
  onLogin: (user?: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Sign Up State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("EVENT_ORGANIZER");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data.user);
      } else {
        setLoginError(data.message || "Invalid username or password");
      }
    } catch {
      setLoginError("Failed to communicate with authentication server");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Sign Up (Register Organizer)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");

    try {
      const res = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess("Account registered successfully! Logging you in...");
        setTimeout(() => {
          onLogin(data.user);
        }, 1000);
      } else {
        setRegError(data.message || "Registration failed");
      }
    } catch {
      setRegError("Server error during registration");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
      {/* Return to Home link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white uppercase transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" /> PIN 21679 Verified
        </span>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-black text-white mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Admin & Organizer Hub</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Sign in with your organizer credentials or register a new event admin account.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-2 border-black bg-zinc-100 dark:bg-zinc-800 p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signin");
              setLoginError("");
            }}
            className={`flex-1 py-2 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "signin"
                ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "text-zinc-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setRegError("");
              setRegSuccess("");
            }}
            className={`flex-1 py-2 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "signup"
                ? "bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "text-zinc-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Organizer
          </button>
        </div>

        {/* TAB 1: SIGN IN */}
        {activeTab === "signin" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <Label className="text-xs font-black uppercase">Username</Label>
              <Input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                placeholder="e.g. admin or organizer_viswa"
                className="font-bold border-2 border-black rounded-none h-11 focus-visible:ring-0 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Password</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="Enter your account password"
                className="border-2 border-black rounded-none h-11 focus-visible:ring-0 mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full py-6 font-black uppercase text-sm bg-black hover:bg-zinc-800 text-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {loginLoading ? "Authenticating..." : "Sign In to Console"}
            </Button>
          </form>
        )}

        {/* TAB 2: REGISTER ORGANIZER (SIGN UP) */}
        {activeTab === "signup" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {regError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <Label className="text-xs font-black uppercase">Full Name</Label>
              <Input
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                placeholder="e.g. Viswanathan P"
                className="font-bold border-2 border-black rounded-none h-10 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Username</Label>
              <Input
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                placeholder="e.g. viswa_symposium"
                className="font-mono text-xs border-2 border-black rounded-none h-10 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Password</Label>
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                placeholder="Create a secure password"
                className="border-2 border-black rounded-none h-10 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Organizer Role</Label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full p-2 border-2 border-black font-bold text-xs bg-white dark:bg-zinc-900 rounded-none mt-1"
              >
                <option value="EVENT_ORGANIZER">EVENT ORGANIZER (Admin for assigned events)</option>
                <option value="SUPER_ADMIN">SUPER ADMIN (Full system access)</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={regLoading}
              className="w-full py-6 font-black uppercase text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {regLoading ? "Registering..." : "Create Account & Enter"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
