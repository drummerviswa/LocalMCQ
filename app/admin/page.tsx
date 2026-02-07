"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminLogin from "@/components/custom/AdminLogin";
import OTP from "@/components/custom/OTP";
import { useAppSelector } from "../hooks";
import instance from "@/lib/axios";
import { AdminNavbar } from "@/components/custom/AdminNavbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { Dot } from "lucide-react";
import DeleteOtpDialog from "@/components/custom/DeleteOtpDialog";

export default function AdminPage() {
  const otpVerified = useAppSelector((state) => state.admin.otpVerified);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    instance
      .get("/admin/auth/me", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    instance.get("/admin/list/result").then((res) => {
      setTeams(res.data.teams);
    });
  }, []);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => Number(b.quizscore) - Number(a.quizscore)),
    [teams],
  );

  const formatTime = (ms: number) =>
    `${Math.floor(ms / 60000) % 60}m ${Math.floor((ms % 60000) / 1000)}s`;

  // ✅ PRINT
  const handlePrint = () => {
    const formatTime = (ms: number) =>
      `${Math.floor(ms / 60000) % 60}m ${Math.floor((ms % 60000) / 1000)}s`;

    const rows = sortedTeams
      .map((team, i) => {
        const p1 = team.members[0];
        const p2 = team.members[1];

        return `
        <tr>
          <td>${i + 1}</td>
          <td>${team.teamname}</td>

          <td>
            <b>Name:</b> ${p1?.name}<br/>
            <b>Mob:</b> ${p1?.mobileno}<br/>
            <b>Dept:</b> ${p1?.department}<br/>
            <b>Course:</b> ${p1?.course}<br/>
            <b>Branch:</b> ${p1?.branch}
          </td>

          <td>
            <b>Name:</b> ${p2?.name}<br/>
            <b>Mob:</b> ${p2?.mobileno}<br/>
            <b>Dept:</b> ${p2?.department}<br/>
            <b>Course:</b> ${p2?.course}<br/>
            <b>Branch:</b> ${p2?.branch}
          </td>

          <td>${team.quizscore} / 20</td>
          <td>${formatTime(Number(team.timeTaken))}</td>
        </tr>
      `;
      })
      .join("");

    const win = window.open("", "", "width=900,height=1000");

    if (win) {
      win.document.write(`
      <html>
        <head>
          <title>Mathrix 26 - Results</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }

            body {
              font-family: Arial, sans-serif;
            }

            h1 {
              text-align: center;
              font-size: 26px;
              margin-bottom: 4px;
            }

            h2 {
              text-align: center;
              font-size: 18px;
              margin-bottom: 20px;
              font-weight: normal;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }

            th, td {
              border: 1px solid #000;
              padding: 8px;
              vertical-align: top;
            }

            th {
              background: #f0f0f0;
              font-size: 15px;
            }

            td {
              font-size: 13px;
            }
          </style>
        </head>

        <body>
          <h1>Mathrix 26</h1>
          <h2>Code Mathrix - Round 1 Results</h2>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Name</th>
                <th>Participant 1 Details</th>
                <th>Participant 2 Details</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);

      win.document.close();
      win.print();
    }
  };

  // ✅ XLSX EXPORT
  const exportExcel = () => {
    const rows = sortedTeams.map((team, i) => ({
      Rank: i + 1,
      Team: team.teamname,
      Participant1: `${team.members[0]?.mobileno} - ${team.members[0]?.department} - ${team.members[0]?.course} - ${team.members[0]?.branch}`,
      Participant2: `${team.members[1]?.mobileno} - ${team.members[1]?.department} - ${team.members[1]?.course} - ${team.members[1]?.branch}`,
      Score: team.quizscore,
      Time: formatTime(Number(team.timeTaken)),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "quiz_results.xlsx");
  };

  if (isLoggedIn === null) return null;

  const handleDeleteAll = async () => {
    if (confirm("Are you sure you want to delete all results?")) {
      await instance.delete("/admin/list/result", {
        withCredentials: true,
      });
      window.location.reload();
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <>
          <AdminNavbar onDeleteClick={() => setDeleteOpen(true)} />

          {sortedTeams.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-2xl font-semibold">No results found</h2>
              <p className="text-zinc-600 mt-2">
                Teams will appear here once they start participating in the
                quiz.
              </p>
            </div>
          ) : (
            <div>
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Quiz Results</h1>
                  <div className="flex gap-3">
                    <Button onClick={handlePrint}>Print</Button>
                    <Button onClick={exportExcel}>Export XLSX</Button>
                  </div>
                </div>

                {/* Printable Area */}
                <div ref={printRef}>
                  <div className="overflow-auto border rounded-lg shadow">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-100">
                        <tr>
                          <th className="p-3 text-left">Rank</th>
                          <th className="p-3 text-left">Team & Participants</th>
                          <th className="p-3 text-left">Score</th>
                          <th className="p-3 text-left">Time</th>
                          <th className="p-3 text-left">Detailed</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedTeams.map((team, i) => (
                          <tr key={team.id} className="border-t">
                            <td className="p-3 font-semibold">#{i + 1}</td>

                            <td className="p-3">
                              <div className="font-semibold uppercase">
                                {team.teamname}
                              </div>
                              {team.members.map((m: any, idx: number) => (
                                <div
                                  key={m.id}
                                  className="text-md text-zinc-600 flex items-center gap-0.5 mt-1">
                                  <Dot />
                                  <span className="font-semibold">
                                    {m.name}
                                  </span>{" "}
                                  —{" "}
                                  <span className="font-semibold">
                                    {m.mobileno}
                                  </span>{" "}
                                  — {m.regno} — {m.department} — {m.course} —{" "}
                                  {m.branch}
                                </div>
                              ))}
                            </td>

                            <td className="p-3">{team.quizscore} / 20</td>
                            <td className="p-3">
                              {Math.floor(Number(team.timeTaken) / 60000) % 60}m{" "}
                              {Math.floor(
                                (Number(team.timeTaken) % 60000) / 1000,
                              )}{" "}
                              s
                            </td>

                            <td className="p-3">
                              <Button
                                size="sm"
                                onClick={() => setSelectedTeam(team)}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Detailed Modal */}
              {selectedTeam && (
                <Dialog open onOpenChange={() => setSelectedTeam(null)}>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto no-scrollbar">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedTeam.teamname} — {selectedTeam.quizscore}/20 —{" "}
                        {formatTime(Number(selectedTeam.timeTaken))}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {selectedTeam.questions?.map((q: any, i: number) => {
                        const correct = q.answer;
                        const given = selectedTeam.answers[i];

                        return (
                          <div key={i} className="border p-3 rounded">
                            <p className="font-medium">
                              {i + 1}. {q.question}
                            </p>

                            <p className="text-sm mt-2">
                              <b>Correct:</b>{" "}
                              <span className="text-green-600">{correct}</span>
                            </p>

                            <p className="text-sm">
                              <b>Answered:</b>{" "}
                              <span
                                className={
                                  !given
                                    ? "text-yellow-600 font-semibold"
                                    : correct === given
                                      ? "text-green-600"
                                      : "text-red-600"
                                }>
                                {given || "Not Answered"}
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <DeleteOtpDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onSuccess={handleDeleteAll}
              />
            </div>
          )}
        </>
      ) : otpVerified ? (
        <AdminLogin open />
      ) : (
        <OTP />
      )}
    </div>
  );
}
