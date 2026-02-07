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
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from "@/lib/axios";

const STORAGE_KEY = "team_draft";

export default function ParticipantModal() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 🔧 Build draft from form
  const buildDraftFromForm = () => {
    if (!formRef.current) return null;
    const form = new FormData(formRef.current);

    return {
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
  };

  // 💾 Auto-save
  const handleChange = () => {
    const draft = buildDraftFromForm();
    if (draft) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  // 🔁 Restore
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (!draft || !formRef.current) return;

    const data = JSON.parse(draft);

    Object.entries(data).forEach(([key, value]) => {
      if (key === "participants") {
        (value as any[]).forEach((p: any, i: number) => {
          Object.entries(p as object).forEach(([k, v]) => {
            const input = formRef.current?.querySelector(
              `[name="participants[${i}].${k}"]`
            ) as HTMLInputElement;
            if (input) input.value = v as string;
          });
        });
      } else {
        const input = formRef.current?.querySelector(
          `[name="${key}"]`
        ) as HTMLInputElement;
        if (input) input.value = value as string;
      }
    });
  }, []);

  // 🚀 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const draft = buildDraftFromForm();
      if (!draft) throw new Error("Form data missing");

      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

      const res = await instance.post("/quiz/register", draft);

      localStorage.setItem("teamname", draft.teamname as string);
      localStorage.setItem("teamid", res.data.team.id);
      localStorage.setItem("teamDetails", JSON.stringify(res.data.team));
      localStorage.removeItem(STORAGE_KEY);

      await document.documentElement.requestFullscreen();
      localStorage.setItem("quiz_locked", "true");

      setOpen(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const ParticipantFields = ({ index }: { index: number }) => (
    <FieldGroup className="gap-2">
      <FieldTitle className="text-lg font-semibold underline text-center">
        Participant {index + 1}
      </FieldTitle>

      {[
        ["name", "Name"],
        ["regno", "Register No."],
        ["department", "Department"],
        ["course", "Course"],
        ["branch", "Branch"],
        ["mobileno", "Mobile No."],
      ].map(([key, label]) => (
        <Field key={key}>
          <Label htmlFor={`${key}-${index}`}>{label}</Label>
          <Input
            id={`${key}-${index}`}
            name={`participants[${index}].${key}`}
            onChange={handleChange}
            required
          />
        </Field>
      ))}
    </FieldGroup>
  );

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Team Registration
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label htmlFor="teamname">Team Name</Label>
            <Input
              id="teamname"
              name="teamname"
              onChange={handleChange}
              placeholder="Enter team name"
              required
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-6">
            <ParticipantFields index={0} />
            <ParticipantFields index={1} />
          </div>

          {error && (
            <p className="text-red-600 text-center font-medium">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-6"
            >
              {loading ? "Registering Team..." : "Submit Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
