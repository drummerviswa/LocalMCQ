/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PinDialog } from "@/components/custom/PinDialog";
import AdminLoginPage from "@/components/custom/AdminLoginPage";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinForDelete, setShowPinForDelete] = useState(false);
  const [deletePendingAction, setDeletePendingAction] = useState<"bulk" | "all" | null>(null);

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
        setLoading(false);
      });
  }, []);

  const fetchTeams = () => {
    fetch("/api/admin/list/result")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.teams)) {
          setTeams(data.teams);
        } else {
          setTeams([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching teams:", err);
        setTeams([]);
      });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
    }
  }, [isAuthenticated]);

  const eligibleTeams = useMemo(
    () => teams.filter(t => !t.disqualified).sort((a, b) => {
      // 1. Sort by score (descending)
      if (b.quizscore !== a.quizscore) return b.quizscore - a.quizscore;

      // 2. Sort by time taken (ascending) - Finished teams first
      const timeA = (a.endTime && a.startTime) ? Number(a.endTime) - Number(a.startTime) : Infinity;
      const timeB = (b.endTime && b.startTime) ? Number(b.endTime) - Number(b.startTime) : Infinity;
      return timeA - timeB;
    }),
    [teams]
  );

  const disqualifiedTeams = useMemo(
    () => teams.filter(t => t.disqualified).sort((a, b) => a.teamname.localeCompare(b.teamname)),
    [teams]
  );

  const formatPlayer = (player: any) => {
    if (!player) return "N/A";
    return `${player.name} - ${player.mobileno} - ${player.regno} - ${player.course}`;
  };

  const formatTime = (start: number, end: number) => {
    if (!start || !end) return "DNF";
    const ms = end - start;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const msecs = ms % 1000;
    return `${mins}m ${secs.toString().padStart(2, '0')}s ${msecs.toString().padStart(3, '0')}ms`;
  };

  const handleExportPDF = (data: any[], title: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    const tableData = data.map((t, i) => [
      i + 1,
      t.teamname,
      formatPlayer(t.members[0]),
      formatPlayer(t.members[1]),
      `${t.quizscore}/20`,
      formatTime(Number(t.startTime), Number(t.endTime)),
      t.disqualified ? "Disqualified" : "Eligible"
    ]);

    autoTable(doc, {
      head: [['Rank', 'Team', 'Player 1', 'Player 2', 'Score', 'Time', 'Status']],
      body: tableData,
      startY: 20,
    });
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  const handleExportExcel = (data: any[], title: string) => {
    const tableData = data.map((t, i) => ({
      Rank: i + 1,
      Team: t.teamname,
      Player1: formatPlayer(t.members[0]),
      Player2: formatPlayer(t.members[1]),
      Score: `${t.quizscore}/20`,
      Time: formatTime(Number(t.startTime), Number(t.endTime)),
      Status: t.disqualified ? "Disqualified" : "Eligible"
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, `${title.replace(/ /g, '_')}.xlsx`);
  };

  const initiateDelete = (type: "bulk" | "all") => {
    setDeletePendingAction(type);
    setShowPinForDelete(true);
  };

  const handleVerifiedForDelete = async () => {
    setShowPinForDelete(false);
    const res = await fetch("/api/admin/list/result", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: "3010",
        ids: deletePendingAction === "bulk" ? selectedIds : []
      })
    });

    if (res.ok) {
      fetchTeams();
      setSelectedIds([]);
    }
    setDeletePendingAction(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!isPinVerified) {
    return <PinDialog open={true} onVerified={() => setIsPinVerified(true)} />;
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const TeamTable = ({ data, title, showRank }: { data: any[], title: string, showRank: boolean }) => (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExportPDF(data, title)}>PDF</Button>
          <Button variant="outline" size="sm" onClick={() => handleExportExcel(data, title)}>Excel</Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="p-3 text-left w-10"></th>
              {showRank && <th className="p-3 text-left">Rank</th>}
              <th className="p-3 text-left">Team Name</th>
              <th className="p-3 text-left">Player 1 Details</th>
              <th className="p-3 text-left">Player 2 Details</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-zinc-500 italic">No teams found</td></tr>
            ) : data.map((t, i) => (
              <tr key={t.id} className="border-t hover:bg-zinc-50">
                <td className="p-3">
                  <Checkbox checked={selectedIds.includes(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                </td>
                {showRank && <td className="p-3 font-semibold">#{i + 1}</td>}
                <td className="p-3">{t.teamname}</td>
                <td className="p-3 text-xs">{formatPlayer(t.members[0])}</td>
                <td className="p-3 text-xs">{formatPlayer(t.members[1])}</td>
                <td className="p-3 font-medium">{t.quizscore} / 20</td>
                <td className="p-3">{formatTime(Number(t.startTime), Number(t.endTime))}</td>
                <td className="p-3">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(t)}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-10 bg-zinc-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => initiateDelete("bulk")}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="destructive" onClick={() => initiateDelete("all")}>
            Delete All Teams
          </Button>
          <Button variant="outline" onClick={async () => { await fetch("/api/admin/auth/logout"); window.location.reload(); }}>
            Logout
          </Button>
        </div>
      </div>

      <TeamTable data={eligibleTeams} title="Eligible Teams" showRank={true} />
      <TeamTable data={disqualifiedTeams} title="Disqualified Teams" showRank={false} />

      {/* Detailed View */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selected.teamname} — Details (Score: {selected.quizscore}/20)
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-zinc-100 rounded-lg">
              <div>
                <p className="font-bold border-b mb-2 pb-1">Player 1</p>
                <p className="text-sm">{formatPlayer(selected.members[0])}</p>
                <p className="text-sm"><b>Dept:</b> {selected.members[0]?.department} | <b>Branch:</b> {selected.members[0]?.branch}</p>
              </div>
              <div>
                <p className="font-bold border-b mb-2 pb-1">Player 2</p>
                <p className="text-sm">{formatPlayer(selected.members[1])}</p>
                <p className="text-sm"><b>Dept:</b> {selected.members[1]?.department} | <b>Branch:</b> {selected.members[1]?.branch}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Question Response History</h3>
              {selected.questions?.map((qid: string, i: number) => {
                const ans = selected.answers.find((a: any) => a.qid === qid);
                const isCorrect = ans?.answer === ans?.question?.answer;
                return (
                  <div key={i} className={`border p-4 rounded-lg ${ans ? (isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50') : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">Q{i + 1} ({ans?.question?.category || 'General'})</span>
                      {ans ? (
                        isCorrect ? <span className="text-green-600 font-bold text-xs">✓ CORRECT</span> : <span className="text-red-600 font-bold text-xs">✗ WRONG</span>
                      ) : (
                        <span className="text-gray-500 font-bold text-xs italic">NOT ANSWERED</span>
                      )}
                    </div>
                    <p className="font-medium text-zinc-900 mb-3">{ans?.question?.question || "Question data unavailable (Deleted or shifted?)"}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-2 pt-2 border-t border-black/5">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Team Answered</span>
                        <span className={`font-bold ${!ans ? 'text-gray-400 italic' : (isCorrect ? 'text-green-700' : 'text-red-700')}`}>
                          {ans?.answer || "No attempt recorded"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Correct Answer</span>
                        <span className="font-bold text-zinc-800">
                          {ans?.question?.answer || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PIN check for deletion */}
      <PinDialog open={showPinForDelete} onVerified={handleVerifiedForDelete} />
    </div>
  );
}
