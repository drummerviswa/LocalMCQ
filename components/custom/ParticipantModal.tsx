/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from "@/lib/axios";

const STORAGE_KEY = "team_draft";

export default function ParticipantModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 🔁 Restore Draft
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (!draft || !formRef.current) return;
    try {
      const data = JSON.parse(draft);
      Object.entries(data).forEach(([key, value]) => {
        if (key === "participants") {
          (value as any[]).forEach((p: any, i: number) => {
            Object.entries(p as object).forEach(([k, v]) => {
              const input = formRef.current?.querySelector(`[name="participants[${i}].${k}"]`) as HTMLInputElement;
              if (input) input.value = v as string;
            });
          });
        } else {
          const input = formRef.current?.querySelector(`[name="${key}"]`) as HTMLInputElement;
          if (input) input.value = value as string;
        }
      });
    } catch { }
  }, []);

  const handleChange = () => {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    const draft = {
      teamname: form.get("teamname"),
      participants: [0, 1].map((i) => ({
        name: form.get(`participants[${i}].name`),
        regno: form.get(`participants[${i}].regno`),
        department: form.get(`participants[${i}].department`),
        course: form.get(`participants[${i}].course`),
        branch: form.get(`participants[${i}].branch`),
        mobileno: form.get(`participants[${i}].mobileno`),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const form = new FormData(formRef.current!);
    const payload = {
      teamname: form.get("teamname"),
      participants: [0, 1].map((i) => ({
        name: form.get(`participants[${i}].name`),
        regno: form.get(`participants[${i}].regno`),
        department: form.get(`participants[${i}].department`),
        course: form.get(`participants[${i}].course`),
        branch: form.get(`participants[${i}].branch`),
        mobileno: form.get(`participants[${i}].mobileno`),
      })),
    };

    try {
      const res = await instance.post("/quiz/register", payload);

      localStorage.setItem("teamname", payload.teamname as string);
      localStorage.setItem("teamid", res.data.team.id);
      localStorage.setItem("teamDetails", JSON.stringify(res.data.team));
      localStorage.removeItem(STORAGE_KEY);

      onSuccess();
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check if team name is unique.");
    } finally {
      setLoading(false);
    }
  };

  const ParticipantSection = ({ index }: { index: number }) => (
    <div className="space-y-4 p-4 bg-zinc-50 rounded-lg border-2 border-zinc-100 no-scrollbar">
      <h3 className="font-black text-zinc-900 border-b-2 border-zinc-200 pb-1 mb-2">PARTICIPANT {index + 1}</h3>
      <div className="grid gap-3 no-scrollbar">
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Full Name</Label>
          <Input name={`participants[${index}].name`} onChange={handleChange} required placeholder="Enter name" />
        </div>
        {/* <div className="grid grid-cols-2 gap-3"> */}
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Reg No</Label>
          <Input name={`participants[${index}].regno`} onChange={handleChange} required placeholder="Registration Number" />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Mobile</Label>
          <Input name={`participants[${index}].mobileno`} onChange={handleChange} required placeholder="Contact Number" />
        </div>
        {/* </div> */}
        {/* <div className="grid grid-cols-2 gap-3"> */}
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Department</Label>
          <Input name={`participants[${index}].department`} onChange={handleChange} required placeholder="e.g. Computer Science" />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Course</Label>
          <Input name={`participants[${index}].course`} onChange={handleChange} required placeholder="e.g. B.E" />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px] font-bold uppercase text-zinc-500">Branch</Label>
          <Input name={`participants[${index}].branch`} onChange={handleChange} required placeholder="e.g. CSE" />
        </div>
        {/* </div> */}
      </div>
    </div>
  );

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-4xl max-h-[95vh] overflow-y-auto border-4 border-black no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-center tracking-tighter uppercase">Team Registration</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 py-4 no-scrollbar">
          <div className="bg-zinc-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Label className="text-sm font-black uppercase mb-2 block">Team Identification Name</Label>
            <Input
              name="teamname"
              onChange={handleChange}
              placeholder="e.g. Binary Beast"
              className="placeholder:text-zinc-400 font-bold"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ParticipantSection index={0} />
            <ParticipantSection index={1} />
          </div>

          {error && <p className="text-red-600 text-center font-black bg-red-50 p-2 border-2 border-red-200">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full text-xl h-16 font-black uppercase rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              {loading ? "Validating Entry..." : "Submit Registration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
