/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AdminLoginPage from "@/components/custom/AdminLoginPage";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Trophy,
  BookOpen,
  Users,
  Upload,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Tv,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Eye,
  LogOut,
  Settings,
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
} from "lucide-react";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"exams" | "questions" | "results" | "admins">("exams");

  // Exams State
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    slug: "",
    type: "MCQ", // "MCQ" or "CODING"
    description: "",
    rules: "",
    durationMinutes: 15,
    totalQuestionsToAsk: 20,
    minTeamSize: 1,
    maxTeamSize: 2,
    status: "LIVE",
    accessCode: "",
    assignedAdminId: "",
  });
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Coding Problems State
  const [problems, setProblems] = useState<any[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: "",
    description: "",
    difficulty: "Medium",
    points: 100,
    constraints: "",
    inputFormat: "",
    outputFormat: "",
    testCases: [
      { input: "", expectedOutput: "", isHidden: false, explanation: "" },
      { input: "", expectedOutput: "", isHidden: true, explanation: "" },
    ],
  });

  // Questions State
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [singleQuestion, setSingleQuestion] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    answer: "",
    category: "General",
    codeSnippet: "",
    points: 1,
  });
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results State
  const [resultsTeams, setResultsTeams] = useState<any[]>([]);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<any | null>(null);

  // Admins State
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    name: "",
    role: "ADMIN",
  });

  // Edit States for CRUD
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);

  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<any>(null);

  const [showEditProblemModal, setShowEditProblemModal] = useState(false);
  const [editProblem, setEditProblem] = useState<any>(null);

  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState<any>(null);

  // 1. Check Auth
  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          if (data.user.role === "SUPER_ADMIN") {
            fetchAdmins();
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Fetch Exams List
  const fetchExams = async () => {
    try {
      const res = await fetch("/api/admin/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.exams);
        if (data.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(data.exams[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchExams();
    }
  }, [isAuthenticated]);

  // 3. Fetch Questions when selectedExamId changes
  const fetchQuestions = async (examId: string) => {
    if (!examId) return;
    setQuestionsLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // 3b. Fetch Problems when selectedExamId is a CODING contest
  const fetchProblems = async (examId: string) => {
    if (!examId) return;
    setProblemsLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/problems`);
      const data = await res.json();
      if (data.success) {
        setProblems(data.problems);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProblemsLoading(false);
    }
  };

  // 4. Fetch Results when selectedExamId changes
  const fetchResults = async (examId: string) => {
    if (!examId) return;
    try {
      const res = await fetch(`/api/admin/exams/${examId}/results`);
      const data = await res.json();
      if (data.success) {
        setResultsTeams(data.teams);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Fetch Admins
  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (data.success) {
        setAdminsList(data.admins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedExamId) return;
    const currentExam = exams.find((e) => e.id === selectedExamId);
    if (activeTab === "questions") {
      if (currentExam?.type === "CODING") {
        fetchProblems(selectedExamId);
      } else {
        fetchQuestions(selectedExamId);
      }
    }
    if (activeTab === "results") fetchResults(selectedExamId);
    if (activeTab === "admins") fetchAdmins();
  }, [selectedExamId, activeTab, exams]);

  // Handle Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExam),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to create exam");
        return;
      }
      setShowCreateExamModal(false);
      setNewExam({
        title: "",
        slug: "",
        type: "MCQ",
        description: "",
        rules: "",
        durationMinutes: 15,
        totalQuestionsToAsk: 20,
        minTeamSize: 1,
        maxTeamSize: 2,
        status: "LIVE",
        accessCode: "",
        assignedAdminId: "",
      });
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Add Coding Problem
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProblem),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to add coding problem");
        return;
      }
      setShowAddProblemModal(false);
      setNewProblem({
        title: "",
        description: "",
        difficulty: "Medium",
        points: 100,
        constraints: "",
        inputFormat: "",
        outputFormat: "",
        testCases: [
          { input: "", expectedOutput: "", isHidden: false, explanation: "" },
          { input: "", expectedOutput: "", isHidden: true, explanation: "" },
        ],
      });
      fetchProblems(selectedExamId);
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Delete Coding Problem
  const handleDeleteProblem = async (problemId: string) => {
    if (!confirm("Are you sure you want to delete this coding problem?")) return;
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/problems/${problemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchProblems(selectedExamId);
        fetchExams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Exam
  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}" and all its questions and teams?`)) return;
    try {
      const res = await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExams();
        if (selectedExamId === id) setSelectedExamId("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Exam Modal
  const openEditExamModal = (exam: any) => {
    setEditExam({
      id: exam.id,
      title: exam.title || "",
      slug: exam.slug || "",
      type: exam.type || "MCQ",
      description: exam.description || "",
      rules: exam.rules || "",
      durationMinutes: exam.durationMinutes || 15,
      totalQuestionsToAsk: exam.totalQuestionsToAsk || 20,
      minTeamSize: exam.minTeamSize || 1,
      maxTeamSize: exam.maxTeamSize || 2,
      status: exam.status || "LIVE",
      accessCode: exam.accessCode || "",
      adminId: exam.adminId || "",
    });
    setShowEditExamModal(true);
  };

  // Handle Update Exam
  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExam?.id) return;
    try {
      const res = await fetch(`/api/admin/exams/${editExam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editExam),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to update exam");
        return;
      }
      setShowEditExamModal(false);
      setEditExam(null);
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Coding Problem Modal
  const openEditProblemModal = (prob: any) => {
    setEditProblem({
      id: prob.id,
      title: prob.title || "",
      description: prob.description || "",
      difficulty: prob.difficulty || "Medium",
      points: prob.points || 100,
      constraints: prob.constraints || "",
      inputFormat: prob.inputFormat || "",
      outputFormat: prob.outputFormat || "",
      testCases:
        Array.isArray(prob.testCases) && prob.testCases.length > 0
          ? prob.testCases.map((tc: any) => ({
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || "",
              isHidden: Boolean(tc.isHidden),
              explanation: tc.explanation || "",
            }))
          : [
              { input: "", expectedOutput: "", isHidden: false, explanation: "" },
              { input: "", expectedOutput: "", isHidden: true, explanation: "" },
            ],
    });
    setShowEditProblemModal(true);
  };

  // Handle Update Coding Problem
  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !editProblem?.id) return;
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/problems/${editProblem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProblem),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to update problem");
        return;
      }
      setShowEditProblemModal(false);
      setEditProblem(null);
      fetchProblems(selectedExamId);
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit MCQ Question Modal
  const openEditQuestionModal = (q: any) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    setEditQuestion({
      id: q.id,
      question: q.question || "",
      optionA: opts[0] || "",
      optionB: opts[1] || "",
      optionC: opts[2] || "",
      optionD: opts[3] || "",
      answer: q.answer || "",
      category: q.category || "General",
      codeSnippet: q.codeSnippet || "",
      points: q.points || 1,
    });
    setShowEditQuestionModal(true);
  };

  // Handle Update MCQ Question
  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !editQuestion?.id) return;
    const options = [
      editQuestion.optionA,
      editQuestion.optionB,
      editQuestion.optionC,
      editQuestion.optionD,
    ].filter(Boolean);

    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/questions/${editQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editQuestion.question,
          options,
          answer: editQuestion.answer,
          category: editQuestion.category,
          codeSnippet: editQuestion.codeSnippet,
          points: editQuestion.points,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to update question");
        return;
      }
      setShowEditQuestionModal(false);
      setEditQuestion(null);
      fetchQuestions(selectedExamId);
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Admin Modal
  const openEditAdminModal = (a: any) => {
    setEditAdmin({
      adminId: a.id,
      name: a.name || "",
      username: a.username || "",
      role: a.role || "EVENT_ORGANIZER",
      password: "",
    });
    setShowEditAdminModal(true);
  };

  // Handle Update Admin
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin?.adminId) return;
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAdmin),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to update admin");
        return;
      }
      setShowEditAdminModal(false);
      setEditAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async (adminId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove admin "${name}"?`)) return;
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to delete admin");
        return;
      }
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Copy Test Link
  const copyTestLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/exam/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Download Sample Excel Template for Question Upload
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        Question: "What is the output of print(2 ** 3 ** 2) in Python?",
        OptionA: "64",
        OptionB: "512",
        OptionC: "256",
        OptionD: "Error",
        Answer: "512",
        Category: "Output",
        CodeSnippet: "x = 2 ** 3 ** 2\nprint(x)",
        Marks: 1,
      },
      {
        Question: "Which data structure uses LIFO (Last In First Out) principle?",
        OptionA: "Queue",
        OptionB: "Array",
        OptionC: "Stack",
        OptionD: "Linked List",
        Answer: "Stack",
        Category: "DataStructures",
        CodeSnippet: "",
        Marks: 1,
      },
      {
        Question: "What is the time complexity of searching in a balanced Binary Search Tree?",
        OptionA: "O(n)",
        OptionB: "O(log n)",
        OptionC: "O(1)",
        OptionD: "O(n^2)",
        Answer: "O(log n)",
        Category: "TimeComplexity",
        CodeSnippet: "",
        Marks: 1,
      },
      {
        Question: "Which command in SQL removes all rows from a table without logging individual row deletions?",
        OptionA: "DELETE",
        OptionB: "DROP",
        OptionC: "TRUNCATE",
        OptionD: "REMOVE",
        Answer: "TRUNCATE",
        Category: "DBMS",
        CodeSnippet: "",
        Marks: 1,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "LocalMCQ_Question_Upload_Template.xlsx");
  };

  // Parse Excel / CSV / JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith(".json")) {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setBulkPreview(Array.isArray(parsed) ? parsed : [parsed]);
          setShowBulkModal(true);
        } catch (err: any) {
          alert("Invalid JSON format: " + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet);
          setBulkPreview(rows);
          setShowBulkModal(true);
        } catch (err: any) {
          alert("Failed to parse spreadsheet: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Submit Bulk Upload to Server
  const handleConfirmBulkUpload = async () => {
    if (!selectedExamId || bulkPreview.length === 0) return;
    setUploadingBulk(true);
    setBulkErrors([]);

    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: bulkPreview }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBulkErrors(data.errors || [data.message || "Bulk upload failed"]);
      } else {
        alert(data.message);
        setShowBulkModal(false);
        setBulkPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchQuestions(selectedExamId);
        fetchExams();
      }
    } catch (err: any) {
      setBulkErrors([err.message]);
    } finally {
      setUploadingBulk(false);
    }
  };

  // Handle Single Question Add
  const handleAddSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: singleQuestion.question,
          options: [
            singleQuestion.optionA,
            singleQuestion.optionB,
            singleQuestion.optionC,
            singleQuestion.optionD,
          ].filter(Boolean),
          answer: singleQuestion.answer,
          category: singleQuestion.category,
          codeSnippet: singleQuestion.codeSnippet || null,
          points: singleQuestion.points,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to add question");
        return;
      }

      setShowAddQuestionModal(false);
      setSingleQuestion({
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        answer: "",
        category: "General",
        codeSnippet: "",
        points: 1,
      });
      fetchQuestions(selectedExamId);
      fetchExams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Delete Question
  const handleDeleteQuestion = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await fetch(`/api/admin/exams/${selectedExamId}/questions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: [qid] }),
      });
      fetchQuestions(selectedExamId);
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete All Questions in Exam
  const handleDeleteAllQuestions = async () => {
    if (!confirm("Are you sure you want to delete ALL questions in this exam's question bank?")) return;
    try {
      await fetch(`/api/admin/exams/${selectedExamId}/questions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      fetchQuestions(selectedExamId);
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to create admin");
        return;
      }
      setShowCreateAdminModal(false);
      setNewAdmin({ username: "", password: "", name: "", role: "ADMIN" });
      fetchAdmins();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Export Results PDF
  const handleExportPDF = () => {
    const currentExam = exams.find((e) => e.id === selectedExamId);
    const isCoding = currentExam?.type === "CODING";
    const title = `${currentExam?.title || "Exam"}_Results`;

    const doc = new jsPDF();
    doc.text(`${currentExam?.title || "Exam"} - Official Leaderboard (${isCoding ? "Coding Contest" : "MCQ Exam"})`, 14, 15);

    if (isCoding) {
      const tableData = resultsTeams.map((t, i) => [
        i + 1,
        t.teamname,
        t.members?.[0]?.name || "N/A",
        t.members?.[1]?.name || "—",
        `${t.codingScore || 0} pts`,
        `${t.totalPassedCases || 0} passed`,
        `${t.submissionCount || 0}`,
        t.penaltyTime ? `${Math.floor(Number(t.penaltyTime) / 60)}m ${Number(t.penaltyTime) % 60}s` : "0s",
        t.disqualified ? "Disqualified" : "Eligible",
      ]);

      autoTable(doc, {
        head: [["Rank", "Team Name", "Participant 1", "Participant 2", "Score", "Cases Passed", "Submissions", "Penalty Time", "Status"]],
        body: tableData,
        startY: 20,
      });
    } else {
      const tableData = resultsTeams.map((t, i) => [
        i + 1,
        t.teamname,
        t.members?.[0]?.name || "N/A",
        t.members?.[1]?.name || "—",
        `${t.quizscore} pts`,
        t.endTime && t.startTime
          ? `${Math.floor((Number(t.endTime) - Number(t.startTime)) / 60000)}m ${Math.floor(
              ((Number(t.endTime) - Number(t.startTime)) % 60000) / 1000
            )}s`
          : "DNF",
        t.disqualified ? "Disqualified" : "Eligible",
      ]);

      autoTable(doc, {
        head: [["Rank", "Team Name", "Participant 1", "Participant 2", "Score", "Time Taken", "Status"]],
        body: tableData,
        startY: 20,
      });
    }

    doc.save(`${title.replace(/ /g, "_")}.pdf`);
  };

  // Export Results Excel
  const handleExportExcel = () => {
    const currentExam = exams.find((e) => e.id === selectedExamId);
    const isCoding = currentExam?.type === "CODING";
    const title = `${currentExam?.title || "Exam"}_Results`;

    const tableData = resultsTeams.map((t, i) => ({
      Rank: i + 1,
      Team: t.teamname,
      Participant1_Name: t.members?.[0]?.name || "N/A",
      Participant1_RegNo: t.members?.[0]?.regno || "N/A",
      Participant1_Mobile: t.members?.[0]?.mobileno || "N/A",
      Participant2_Name: t.members?.[1]?.name || "—",
      Participant2_RegNo: t.members?.[1]?.regno || "—",
      Participant2_Mobile: t.members?.[1]?.mobileno || "—",
      ...(isCoding
        ? {
            CodingScore: t.codingScore || 0,
            TotalPassedCases: t.totalPassedCases || 0,
            SubmissionsCount: t.submissionCount || 0,
            PenaltyTime_Seconds: t.penaltyTime || 0,
          }
        : {
            Score: t.quizscore,
            TimeTaken_Seconds:
              t.endTime && t.startTime ? Math.floor((Number(t.endTime) - Number(t.startTime)) / 1000) : "DNF",
          }),
      Disqualified: t.disqualified ? "YES" : "NO",
      Strikes: t.strikes,
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");
    XLSX.writeFile(wb, `${title.replace(/ /g, "_")}.xlsx`);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-bold">
        Checking admin credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const currentExamObj = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-zinc-900 border-b-4 border-black px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-black text-white px-2.5 sm:px-3 py-1 font-black text-lg sm:text-xl uppercase tracking-tighter">
            LocalMCQ Admin
          </div>
          <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase ${
            currentUser?.role === "SUPER_ADMIN"
              ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-400"
              : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-400"
          }`}>
            {currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Event Organizer"}
          </span>
          <span className="text-xs text-zinc-500 font-bold hidden lg:inline">
            Logged in as: {currentUser?.name} (@{currentUser?.username})
          </span>
        </div>

        {/* Tab Buttons & Tools */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 shrink-0">
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-2.5 sm:px-3 py-1.5 font-black text-xs md:text-sm uppercase border-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "exams"
                ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "border-zinc-300 hover:border-black bg-white dark:bg-zinc-800"
            }`}
          >
            <Settings className="w-4 h-4" /> {currentUser?.role === "SUPER_ADMIN" ? "All Exams" : "My Events"}
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-2.5 sm:px-3 py-1.5 font-black text-xs md:text-sm uppercase border-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "questions"
                ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "border-zinc-300 hover:border-black bg-white dark:bg-zinc-800"
            }`}
          >
            {currentExamObj?.type === "CODING" ? (
              <>
                <Code2 className="w-4 h-4" /> Coding Problems
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" /> Question Banks
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-2.5 sm:px-3 py-1.5 font-black text-xs md:text-sm uppercase border-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "results"
                ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "border-zinc-300 hover:border-black bg-white dark:bg-zinc-800"
            }`}
          >
            <Trophy className="w-4 h-4" /> Leaderboards
          </button>

          {/* Only SuperAdmin can manage Organizers */}
          {currentUser?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-2.5 sm:px-3 py-1.5 font-black text-xs md:text-sm uppercase border-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "admins"
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "border-zinc-300 hover:border-black bg-white dark:bg-zinc-800"
              }`}
            >
              <Users className="w-4 h-4" /> Organizers
            </button>
          )}

          <a
            href="/ide"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 sm:px-3 py-1.5 font-black text-xs uppercase border-2 border-black bg-zinc-950 text-emerald-400 hover:bg-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
          >
            IDE Studio
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold ml-1 rounded-none h-8 px-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {/* ================= TAB 1: EXAMS ================= */}
        {activeTab === "exams" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Active Exams & Test Links</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Create and manage separate exam contests, custom links, and duration for your symposium.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateExamModal(true)}
                className="bg-black hover:bg-zinc-800 text-white font-black uppercase border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create New Exam
              </Button>
            </div>

            {exams.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border-4 border-dashed border-zinc-300 p-12 text-center">
                <Settings className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                <h3 className="text-xl font-bold mb-1">No Exams Created Yet</h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Create your first symposium exam (e.g., "Round 1 - Code Matrix") to generate test links.
                </p>
                <Button onClick={() => setShowCreateExamModal(true)} className="font-black rounded-none">
                  Create First Exam
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white dark:bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                              ex.status === "LIVE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                                : ex.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-500"
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
                        <span className="text-xs text-zinc-400 font-bold font-mono">
                          ⏱ {ex.durationMinutes} mins
                        </span>
                      </div>

                      <h3 className="text-xl font-black uppercase mb-1">{ex.title}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                        {ex.description || "No description provided."}
                      </p>

                      <div className="bg-zinc-100 dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700 mb-4 space-y-1 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Slug URL:</span>
                          <span className="font-mono font-bold text-blue-600">/exam/{ex.slug}</span>
                        </div>
                        {ex.type === "CODING" ? (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Problems:</span>
                            <span className="font-bold text-purple-600">
                              {ex._count?.problems || 0} coding challenges
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Questions:</span>
                            <span>
                              {ex._count?.questions || 0} in bank (Serves {ex.totalQuestionsToAsk})
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Teams Registered:</span>
                          <span className="font-bold">{ex._count?.teams || 0} teams</span>
                        </div>
                        {ex.accessCode && (
                          <div className="flex justify-between text-yellow-600 font-bold">
                            <span>PIN / Code:</span>
                            <span>{ex.accessCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTestLink(ex.slug)}
                          className="flex-1 font-bold text-xs border border-black rounded-none flex items-center justify-center gap-1"
                        >
                          {copiedSlug === ex.slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Link
                            </>
                          )}
                        </Button>
                        <a
                          href={`/exam/${ex.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 border border-black hover:bg-zinc-100 flex items-center justify-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedExamId(ex.id);
                            setActiveTab("questions");
                          }}
                          className="flex-1 font-bold text-xs rounded-none border border-black"
                        >
                          {ex.type === "CODING"
                            ? `Problems (${ex._count?.problems || 0})`
                            : `Questions (${ex._count?.questions || 0})`}
                        </Button>
                        <a
                          href={`/admin/projector/${ex.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 border border-black bg-blue-50 text-blue-700 font-black text-xs hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Tv className="w-3.5 h-3.5" /> Stage Mode
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditExamModal(ex)}
                          className="rounded-none px-2 border-black hover:bg-amber-100"
                          title="Edit Contest Settings"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteExam(ex.id, ex.title)}
                          className="rounded-none px-2"
                          title="Delete Contest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: QUESTION / PROBLEM BANKS ================= */}
        {activeTab === "questions" && (
          <div>
            {currentExamObj?.type === "CODING" ? (
              /* Coding Problems Bank */
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Coding Problems Manager</h2>
                    <p className="text-sm text-zinc-500 font-medium">
                      Create algorithmic problems, sample test cases, hidden evaluation test cases, and constraints.
                    </p>
                  </div>

                  {/* Exam Selector */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-black uppercase">Active Exam:</Label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title} ({ex.type === "CODING" ? `${ex._count?.problems || 0} problems` : `${ex._count?.questions || 0} questions`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => setShowAddProblemModal(true)}
                      className="bg-black hover:bg-zinc-800 text-white font-black uppercase rounded-none border-2 border-black flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Programming Problem
                    </Button>
                    <a
                      href="/ide"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 border-2 border-black bg-zinc-950 text-emerald-400 font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Code2 className="w-4 h-4" /> Test in IDE Studio
                    </a>
                  </div>
                  <div className="text-xs font-bold text-zinc-500">
                    Contest Type: <span className="text-purple-600 font-black uppercase">CODING ARENA</span>
                  </div>
                </div>

                {/* Problems Table */}
                {problemsLoading ? (
                  <div className="py-20 text-center font-bold animate-pulse">Loading Coding Problems...</div>
                ) : problems.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border-4 border-dashed border-zinc-300 p-12 text-center">
                    <Code2 className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                    <h3 className="text-xl font-bold mb-1">No Coding Problems Added Yet</h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      Create algorithmic challenges with sample and hidden test cases for this contest.
                    </p>
                    <Button onClick={() => setShowAddProblemModal(true)} className="font-black rounded-none">
                      Add First Problem
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border-4 border-black overflow-x-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase text-xs border-b-2 border-black">
                        <tr>
                          <th className="p-3 w-12">#</th>
                          <th className="p-3">Problem Title</th>
                          <th className="p-3">Difficulty</th>
                          <th className="p-3">Points</th>
                          <th className="p-3">Test Cases</th>
                          <th className="p-3">Submissions</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {problems.map((prob, idx) => {
                          const sampleCount = prob.testCases?.filter((tc: any) => !tc.isHidden).length || 0;
                          const hiddenCount = prob.testCases?.filter((tc: any) => tc.isHidden).length || 0;
                          return (
                            <tr key={prob.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="p-3 font-bold text-zinc-400">{idx + 1}</td>
                              <td className="p-3 max-w-md">
                                <div className="font-bold text-base">{prob.title}</div>
                                <div className="text-xs text-zinc-500 line-clamp-1">{prob.description}</div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 text-xs font-black uppercase border ${
                                    prob.difficulty === "Easy"
                                      ? "bg-green-100 text-green-800 border-green-500"
                                      : prob.difficulty === "Hard"
                                      ? "bg-red-100 text-red-800 border-red-500"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-500"
                                  }`}
                                >
                                  {prob.difficulty}
                                </span>
                              </td>
                              <td className="p-3 font-black text-purple-600">{prob.points} Pts</td>
                              <td className="p-3 text-xs">
                                <span className="font-bold text-blue-600">{sampleCount} Sample</span>
                                <span className="text-zinc-400 mx-1">/</span>
                                <span className="text-zinc-600 font-bold">{hiddenCount} Hidden</span>
                              </td>
                              <td className="p-3 font-mono text-xs">{prob._count?.submissions || 0}</td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => openEditProblemModal(prob)}
                                  className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                                  title="Edit Problem"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProblem(prob.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete Problem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* MCQ Question Bank */
              <div>
                {/* Top Bar for Questions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Question Bank Manager</h2>
                    <p className="text-sm text-zinc-500 font-medium">
                      Upload questions for someone or create exam-specific question sets via Excel, CSV, or form.
                    </p>
                  </div>

                  {/* Exam Selector */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-black uppercase">Active Exam:</Label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title} ({ex._count?.questions || 0} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx, .xls, .csv, .json"
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-none border-2 border-black flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel / CSV / JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadSampleExcel}
                      className="font-bold border-2 border-black rounded-none flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Sample Excel Template
                    </Button>
                    <Button
                      onClick={() => setShowAddQuestionModal(true)}
                      className="bg-black hover:bg-zinc-800 text-white font-black uppercase rounded-none border-2 border-black flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Single Question
                    </Button>
                  </div>

                  {questions.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAllQuestions}
                      className="rounded-none font-bold"
                    >
                      Delete All Questions ({questions.length})
                    </Button>
                  )}
                </div>

                {/* Questions Table */}
                {questionsLoading ? (
                  <div className="py-20 text-center font-bold animate-pulse">Loading Question Bank...</div>
                ) : questions.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border-4 border-dashed border-zinc-300 p-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                    <h3 className="text-xl font-bold mb-1">No Questions In This Bank</h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      Upload an Excel/CSV file with questions or add questions manually.
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} className="font-black rounded-none">
                      Upload Spreadsheet
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border-4 border-black overflow-x-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase text-xs border-b-2 border-black">
                        <tr>
                          <th className="p-3 w-12">#</th>
                          <th className="p-3">Question</th>
                          <th className="p-3">Options</th>
                          <th className="p-3">Correct Answer</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {questions.map((q, idx) => (
                          <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="p-3 font-bold text-zinc-400">{idx + 1}</td>
                            <td className="p-3 max-w-md">
                              <div className="font-semibold">{q.question}</div>
                              {q.codeSnippet && (
                                <pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                                  {q.codeSnippet}
                                </pre>
                              )}
                            </td>
                            <td className="p-3 text-xs space-y-1">
                              {Array.isArray(q.options) &&
                                q.options.map((opt: string, oi: number) => (
                                  <div
                                    key={oi}
                                    className={
                                      opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                                        ? "text-emerald-600 font-bold"
                                        : "text-zinc-500"
                                    }
                                  >
                                    {String.fromCharCode(65 + oi)}. {opt}
                                  </div>
                                ))}
                            </td>
                            <td className="p-3 font-bold text-emerald-600">{q.answer}</td>
                            <td className="p-3">
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-bold rounded">
                                {q.category || "General"}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => openEditQuestionModal(q)}
                                className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                                title="Edit Question"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: RESULTS & LEADERBOARDS ================= */}
        {activeTab === "results" && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Exam Results & Leaderboard</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Rankings dynamically sorted by highest score first, then quickest completion speed.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  className="border-2 border-black rounded-none font-bold text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-red-500" /> Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="border-2 border-black rounded-none font-bold text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
                </Button>
              </div>
            </div>

            {resultsTeams.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border-4 border-dashed border-zinc-300 p-12 text-center">
                <Trophy className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                <h3 className="text-xl font-bold mb-1">No Submissions Recorded</h3>
                <p className="text-zinc-500 text-sm">
                  Teams will automatically appear here once they register or submit their answers.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border-4 border-black overflow-x-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {currentExamObj?.type === "CODING" ? (
                  /* Coding Contest Leaderboard */
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-xs border-b-2 border-black">
                      <tr>
                        <th className="p-3 w-12">Rank</th>
                        <th className="p-3">Team Name</th>
                        <th className="p-3">Participants</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Cases Passed</th>
                        <th className="p-3">Submissions</th>
                        <th className="p-3">Penalty / Elapsed</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {resultsTeams.map((team, idx) => {
                        const penaltySec = team.penaltyTime ? Number(team.penaltyTime) : 0;
                        const penaltyFmt = `${Math.floor(penaltySec / 60)}m ${penaltySec % 60}s`;

                        return (
                          <tr key={team.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="p-3 font-black">
                              <span
                                className={`px-2 py-0.5 text-xs font-black ${
                                  idx === 0
                                    ? "bg-amber-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                    : idx === 1
                                    ? "bg-zinc-300 text-black border border-black"
                                    : idx === 2
                                    ? "bg-amber-700 text-white"
                                    : "text-zinc-500 font-bold"
                                }`}
                              >
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="p-3 font-bold">{team.teamname}</td>
                            <td className="p-3 text-xs space-y-0.5">
                              {team.members?.map((m: any, mi: number) => (
                                <div key={mi}>
                                  <b>{m.name}</b> ({m.regno}) - {m.department}
                                </div>
                              ))}
                            </td>
                            <td className="p-3 font-black text-purple-600 text-base">
                              {team.codingScore || 0} Pts
                            </td>
                            <td className="p-3 font-bold text-emerald-600 text-sm">
                              {team.totalPassedCases || 0} passed
                            </td>
                            <td className="p-3 font-mono text-xs">
                              {team.submissionCount || 0} attempts
                            </td>
                            <td className="p-3 font-mono text-xs">{penaltyFmt}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                                  team.disqualified
                                    ? "bg-red-100 text-red-700 border-red-500"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-500"
                                }`}
                              >
                                {team.disqualified ? "Disqualified" : "Eligible"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTeamDetails(team)}
                                className="font-bold text-xs border border-black rounded-none"
                              >
                                <Code2 className="w-3.5 h-3.5 mr-1" /> View Code
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* MCQ Contest Leaderboard */
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-xs border-b-2 border-black">
                      <tr>
                        <th className="p-3 w-12">Rank</th>
                        <th className="p-3">Team Name</th>
                        <th className="p-3">Participants</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Time Taken</th>
                        <th className="p-3">Strikes</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {resultsTeams.map((team, idx) => {
                        const timeTaken =
                          team.startTime && team.endTime
                            ? `${Math.floor((Number(team.endTime) - Number(team.startTime)) / 60000)}m ${Math.floor(
                                ((Number(team.endTime) - Number(team.startTime)) % 60000) / 1000
                              )}s`
                            : "In Progress / DNF";

                        return (
                          <tr key={team.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="p-3 font-black">#{idx + 1}</td>
                            <td className="p-3 font-bold">{team.teamname}</td>
                            <td className="p-3 text-xs space-y-0.5">
                              {team.members?.map((m: any, mi: number) => (
                                <div key={mi}>
                                  <b>{m.name}</b> ({m.regno}) - {m.department}
                                </div>
                              ))}
                            </td>
                            <td className="p-3 font-black text-blue-600 text-base">{team.quizscore} Pts</td>
                            <td className="p-3 font-mono text-xs">{timeTaken}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-xs font-bold ${
                                  team.strikes > 0 ? "text-red-600 bg-red-100" : "text-zinc-500"
                                }`}
                              >
                                {team.strikes} / 3
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                                  team.disqualified
                                    ? "bg-red-100 text-red-700 border-red-500"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-500"
                                }`}
                              >
                                {team.disqualified ? "Disqualified" : "Eligible"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTeamDetails(team)}
                                className="font-bold text-xs"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ADMINS MANAGEMENT ================= */}
        {activeTab === "admins" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Admin & Organizer Accounts</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Delegate access to your juniors and co-organizers so each person can manage their own exams.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateAdminModal(true)}
                className="bg-black hover:bg-zinc-800 text-white font-black uppercase border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Junior Admin
              </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-4 border-black overflow-x-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-xs border-b-2 border-black">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Exams Assigned</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {adminsList.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-3 font-bold">{a.name}</td>
                      <td className="p-3 font-mono text-zinc-500">@{a.username}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-black uppercase">
                          {a.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{a._count?.exams || 0} exams</td>
                      <td className="p-3 text-xs text-zinc-400">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditAdminModal(a)}
                          className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                          title="Edit Admin"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {a.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteAdmin(a.id, a.name)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* Modal: Create Exam */}
      <Dialog open={showCreateExamModal} onOpenChange={setShowCreateExamModal}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Create New Exam / Contest</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExam} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-black uppercase">Exam Title</Label>
              <Input
                value={newExam.title}
                onChange={(e) => {
                  const title = e.target.value;
                  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                  setNewExam((prev) => ({ ...prev, title, slug }));
                }}
                required
                placeholder="e.g. Code Matrix - Round 1"
                className="font-bold rounded-none border-2 border-black"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">
                URL Slug (Test Link: /exam/{"<slug>"})
              </Label>
              <Input
                value={newExam.slug}
                onChange={(e) => setNewExam({ ...newExam, slug: e.target.value })}
                required
                placeholder="e.g. code-matrix-r1"
                className="font-mono text-xs rounded-none border-2 border-black"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Short Description</Label>
              <Input
                value={newExam.description}
                onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                placeholder="e.g. Technical round testing core C, Python and Data Structures"
                className="rounded-none border-2 border-black text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black uppercase">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={newExam.durationMinutes}
                  onChange={(e) => setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })}
                  required
                  className="rounded-none border-2 border-black font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Questions per Candidate</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newExam.totalQuestionsToAsk}
                  onChange={(e) => setNewExam({ ...newExam, totalQuestionsToAsk: Number(e.target.value) })}
                  required
                  className="rounded-none border-2 border-black font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black uppercase">Min Team Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={newExam.minTeamSize}
                  onChange={(e) => setNewExam({ ...newExam, minTeamSize: Number(e.target.value) })}
                  required
                  className="rounded-none border-2 border-black font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Max Team Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={newExam.maxTeamSize}
                  onChange={(e) => setNewExam({ ...newExam, maxTeamSize: Number(e.target.value) })}
                  required
                  className="rounded-none border-2 border-black font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black uppercase">Contest Type</Label>
                <select
                  value={newExam.type}
                  onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}
                  className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                >
                  <option value="MCQ">MCQ Contest (Multiple Choice Questions)</option>
                  <option value="CODING">Coding Contest (Monaco Editor & Test Cases)</option>
                </select>
              </div>
              {currentUser?.role === "SUPER_ADMIN" ? (
                <div>
                  <Label className="text-xs font-black uppercase">Assign to Organizer (Optional)</Label>
                  <select
                    value={newExam.assignedAdminId}
                    onChange={(e) => setNewExam({ ...newExam, assignedAdminId: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="">Myself ({currentUser?.name})</option>
                    {adminsList.map((adm) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name} (@{adm.username}) - {adm.role}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-black uppercase">Exam Status</Label>
                  <select
                    value={newExam.status}
                    onChange={(e) => setNewExam({ ...newExam, status: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="LIVE">LIVE (Accepting Submissions)</option>
                    <option value="DRAFT">DRAFT (Locked for Students)</option>
                    <option value="ENDED">ENDED (Closed)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentUser?.role === "SUPER_ADMIN" && (
                <div>
                  <Label className="text-xs font-black uppercase">Exam Status</Label>
                  <select
                    value={newExam.status}
                    onChange={(e) => setNewExam({ ...newExam, status: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="LIVE">LIVE (Accepting Submissions)</option>
                    <option value="DRAFT">DRAFT (Locked for Students)</option>
                    <option value="ENDED">ENDED (Closed)</option>
                  </select>
                </div>
              )}
              <div className={currentUser?.role === "SUPER_ADMIN" ? "" : "col-span-2"}>
                <Label className="text-xs font-black uppercase">Optional Access PIN / Code</Label>
                <Input
                  value={newExam.accessCode}
                  onChange={(e) => setNewExam({ ...newExam, accessCode: e.target.value })}
                  placeholder="Leave empty for public link"
                  className="rounded-none border-2 border-black text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg font-black uppercase rounded-none border-2 border-black bg-black text-white"
            >
              Save & Create Exam
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Programming Problem */}
      <Dialog open={showAddProblemModal} onOpenChange={setShowAddProblemModal}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Add Programming Problem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProblem} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-black uppercase">Problem Title</Label>
              <Input
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                required
                placeholder="e.g. Invert Binary Tree or Two Sum"
                className="font-bold rounded-none border-2 border-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black uppercase">Difficulty</Label>
                <select
                  value={newProblem.difficulty}
                  onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                  className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Score / Points</Label>
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  value={newProblem.points}
                  onChange={(e) => setNewProblem({ ...newProblem, points: Number(e.target.value) })}
                  required
                  className="rounded-none border-2 border-black font-bold"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Problem Description</Label>
              <textarea
                value={newProblem.description}
                onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                required
                rows={4}
                placeholder="Write the full problem statement and requirements here..."
                className="w-full p-2.5 border-2 border-black font-sans text-sm bg-white dark:bg-zinc-900 rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black uppercase">Input Format</Label>
                <textarea
                  value={newProblem.inputFormat}
                  onChange={(e) => setNewProblem({ ...newProblem, inputFormat: e.target.value })}
                  rows={2}
                  placeholder="e.g. First line contains integer N, followed by N integers"
                  className="w-full p-2 border-2 border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Output Format</Label>
                <textarea
                  value={newProblem.outputFormat}
                  onChange={(e) => setNewProblem({ ...newProblem, outputFormat: e.target.value })}
                  rows={2}
                  placeholder="e.g. Print single integer representing the answer"
                  className="w-full p-2 border-2 border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Constraints</Label>
              <Input
                value={newProblem.constraints}
                onChange={(e) => setNewProblem({ ...newProblem, constraints: e.target.value })}
                placeholder="e.g. 1 <= N <= 10^5, -10^9 <= A[i] <= 10^9"
                className="font-mono text-xs rounded-none border-2 border-black"
              />
            </div>

            {/* Test Cases Builder */}
            <div className="pt-2 border-t-2 border-black/10">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-black uppercase">
                  Test Cases ({newProblem.testCases.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewProblem({
                      ...newProblem,
                      testCases: [
                        ...newProblem.testCases,
                        { input: "", expectedOutput: "", isHidden: true, explanation: "" },
                      ],
                    })
                  }
                  className="font-bold text-xs border border-black rounded-none"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Test Case
                </Button>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {newProblem.testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-black space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase text-zinc-600">
                        Test Case #{idx + 1} {tc.isHidden ? "(Hidden Evaluation)" : "(Visible Sample)"}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => {
                              const updated = [...newProblem.testCases];
                              updated[idx].isHidden = e.target.checked;
                              setNewProblem({ ...newProblem, testCases: updated });
                            }}
                          />
                          Hidden
                        </label>
                        {newProblem.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newProblem.testCases.filter((_, i) => i !== idx);
                              setNewProblem({ ...newProblem, testCases: updated });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Standard Input</Label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => {
                            const updated = [...newProblem.testCases];
                            updated[idx].input = e.target.value;
                            setNewProblem({ ...newProblem, testCases: updated });
                          }}
                          required
                          rows={2}
                          placeholder="e.g. 5\n1 2 3 4 5"
                          className="w-full p-1.5 border border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Expected Output</Label>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={(e) => {
                            const updated = [...newProblem.testCases];
                            updated[idx].expectedOutput = e.target.value;
                            setNewProblem({ ...newProblem, testCases: updated });
                          }}
                          required
                          rows={2}
                          placeholder="e.g. 15"
                          className="w-full p-1.5 border border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 font-black uppercase rounded-none border-2 border-black bg-black text-white text-base mt-4"
            >
              Save Problem to Contest
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Bulk Upload Preview */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">
              Bulk Upload Verification ({bulkPreview.length} Questions Detected)
            </DialogTitle>
          </DialogHeader>

          <div className="my-4">
            <p className="text-sm text-zinc-600 mb-3">
              Reviewing spreadsheet parse before uploading into <b>{currentExamObj?.title}</b>.
            </p>

            {bulkErrors.length > 0 && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs mb-4 space-y-1">
                {bulkErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto border-2 border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0 uppercase">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Question</th>
                    <th className="p-2">Answer</th>
                    <th className="p-2">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {bulkPreview.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold">{i + 1}</td>
                      <td className="p-2 max-w-xs truncate">{row.Question || row.question}</td>
                      <td className="p-2 font-bold text-emerald-600">{row.Answer || row.answer}</td>
                      <td className="p-2">{row.Category || row.category || "General"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bulkPreview.length > 50 && (
              <p className="text-xs text-zinc-400 mt-2 italic">
                ...and {bulkPreview.length - 50} more questions ready to upload.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkModal(false)} className="rounded-none font-bold border-2 border-black">
              Cancel
            </Button>
            <Button
              disabled={uploadingBulk}
              onClick={handleConfirmBulkUpload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-none border-2 border-black"
            >
              {uploadingBulk ? "Importing to Database..." : `Import ${bulkPreview.length} Questions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Single Question */}
      <Dialog open={showAddQuestionModal} onOpenChange={setShowAddQuestionModal}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Add Single Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSingleQuestion} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-black uppercase">Question Text</Label>
              <Input
                value={singleQuestion.question}
                onChange={(e) => setSingleQuestion({ ...singleQuestion, question: e.target.value })}
                required
                placeholder="Enter the MCQ question"
                className="font-bold rounded-none border-2 border-black"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase">Optional Code Block (for Programming/Output)</Label>
              <textarea
                value={singleQuestion.codeSnippet}
                onChange={(e) => setSingleQuestion({ ...singleQuestion, codeSnippet: e.target.value })}
                rows={3}
                placeholder="Paste code snippet here..."
                className="w-full p-2 border-2 border-black font-mono text-xs bg-zinc-950 text-emerald-400 rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase">Option A</Label>
                <Input
                  value={singleQuestion.optionA}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, optionA: e.target.value })}
                  required
                  placeholder="Option A text"
                  className="rounded-none border border-black text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Option B</Label>
                <Input
                  value={singleQuestion.optionB}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, optionB: e.target.value })}
                  required
                  placeholder="Option B text"
                  className="rounded-none border border-black text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Option C</Label>
                <Input
                  value={singleQuestion.optionC}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, optionC: e.target.value })}
                  required
                  placeholder="Option C text"
                  className="rounded-none border border-black text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Option D</Label>
                <Input
                  value={singleQuestion.optionD}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, optionD: e.target.value })}
                  required
                  placeholder="Option D text"
                  className="rounded-none border border-black text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-black uppercase">Correct Answer</Label>
                <Input
                  value={singleQuestion.answer}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, answer: e.target.value })}
                  required
                  placeholder="Exact text or option"
                  className="font-bold border-2 border-black text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Category</Label>
                <Input
                  value={singleQuestion.category}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, category: e.target.value })}
                  required
                  placeholder="e.g. DBMS, OS, Output"
                  className="border-2 border-black text-sm font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={singleQuestion.points}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, points: Number(e.target.value) })}
                  className="border-2 border-black text-sm font-bold"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-6 font-black uppercase rounded-none border-2 border-black bg-black text-white">
              Add Question to Bank
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Team Details Inspection */}
      {selectedTeamDetails && (
        <Dialog open onOpenChange={() => setSelectedTeamDetails(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase">
                {selectedTeamDetails.teamname} —{" "}
                {currentExamObj?.type === "CODING"
                  ? `Code Submissions Audit (${selectedTeamDetails.codingScore || 0} Pts)`
                  : `Response Audit (${selectedTeamDetails.quizscore} Pts)`}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-black">
              {selectedTeamDetails.members?.map((m: any, i: number) => (
                <div key={i}>
                  <p className="font-black text-sm uppercase mb-1">Participant {i + 1}</p>
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-zinc-500">
                    Reg: {m.regno} • Mobile: {m.mobileno}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Dept: {m.department} • {m.branch} ({m.course})
                  </p>
                </div>
              ))}
            </div>

            {currentExamObj?.type === "CODING" ? (
              /* Coding Submissions Audit */
              <div className="space-y-4">
                <h3 className="font-black uppercase text-sm">
                  Problem Submissions History ({selectedTeamDetails.submissions?.length || 0}):
                </h3>
                {!selectedTeamDetails.submissions || selectedTeamDetails.submissions.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 font-bold border-2 border-dashed border-zinc-300">
                    No code submissions recorded yet for this team.
                  </div>
                ) : (
                  selectedTeamDetails.submissions.map((sub: any, i: number) => {
                    const isAccepted = sub.status === "ACCEPTED";
                    return (
                      <div
                        key={sub.id || i}
                        className={`p-4 border-2 ${
                          isAccepted
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100"
                            : "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-950 dark:text-red-100"
                        }`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div>
                            <span className="font-black text-sm uppercase mr-2">
                              {sub.problem?.title || "Problem"}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-black uppercase border ${
                                isAccepted
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                                  : "bg-red-100 text-red-800 border-red-500"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono font-bold">
                            <span className="text-purple-600 font-black">{sub.score} Pts</span>
                            <span className="text-blue-600">
                              {sub.testCasesPassed} / {sub.totalTestCases} Cases
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-300 uppercase">
                              {sub.language}
                            </span>
                            {sub.executionTimeMs && (
                              <span className="text-zinc-500 font-mono">⏱ {sub.executionTimeMs}ms</span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 font-mono mb-2">
                          Submitted: {new Date(sub.submittedAt).toLocaleTimeString()}
                        </div>

                        {/* Submitted Code Block */}
                        <div className="mt-2">
                          <div className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 mb-1">
                            Submitted Source Code ({sub.language}):
                          </div>
                          <pre className="p-3 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-64 border border-black selection:bg-emerald-800">
                            {sub.code}
                          </pre>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* MCQ Questions Response Audit */
              <div className="space-y-4">
                <h3 className="font-black uppercase text-sm">Question Response Breakdown:</h3>
                {selectedTeamDetails.questions?.map((qid: string, i: number) => {
                  const ans = selectedTeamDetails.answers?.find((a: any) => a.qid === qid);
                  const isCorrect =
                    ans &&
                    ans.answer &&
                    ans.question?.answer &&
                    ans.answer.trim().toLowerCase() === ans.question.answer.trim().toLowerCase();

                  return (
                    <div
                      key={i}
                      className={`p-4 border-2 ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                          : "bg-red-50 border-red-400 text-red-950"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-xs uppercase">Question {i + 1}</span>
                        <span
                          className={`text-xs font-black uppercase ${
                            isCorrect ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {isCorrect ? "✓ CORRECT" : "✗ WRONG / UNATTEMPTED"}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mb-2">
                        {ans?.question?.question || "Question text unavailable"}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-black/10">
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px]">
                            Candidate Submitted:
                          </span>
                          <span className="font-bold">{ans?.answer || "No attempt recorded"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px]">
                            Correct Answer:
                          </span>
                          <span className="font-bold">{ans?.question?.answer || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Create Event Organizer */}
      <Dialog open={showCreateAdminModal} onOpenChange={setShowCreateAdminModal}>
        <DialogContent className="max-w-md border-4 border-black rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Add Event Organizer / Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-black uppercase">Full Name</Label>
              <Input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
                placeholder="e.g. Rahul Sharma"
                className="font-bold rounded-none border-2 border-black"
              />
            </div>
            <div>
              <Label className="text-xs font-black uppercase">Username</Label>
              <Input
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
                placeholder="e.g. rahul_organizer"
                className="font-mono text-xs rounded-none border-2 border-black"
              />
            </div>
            <div>
              <Label className="text-xs font-black uppercase">Password</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                placeholder="Enter secure password"
                className="rounded-none border-2 border-black"
              />
            </div>
            <div>
              <Label className="text-xs font-black uppercase">Role & Permissions</Label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
              >
                <option value="EVENT_ORGANIZER">EVENT ORGANIZER (Admin for assigned events)</option>
                <option value="SUPER_ADMIN">SUPER ADMIN (Full system access)</option>
              </select>
            </div>
            <Button type="submit" className="w-full py-6 font-black uppercase rounded-none border-2 border-black bg-black text-white">
              Create Organizer Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Exam */}
      {editExam && (
        <Dialog open={showEditExamModal} onOpenChange={setShowEditExamModal}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" /> Edit Contest Settings
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateExam} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-black uppercase">Exam Title</Label>
                <Input
                  value={editExam.title}
                  onChange={(e) => setEditExam({ ...editExam, title: e.target.value })}
                  required
                  placeholder="e.g. Code Matrix - Round 1"
                  className="font-bold rounded-none border-2 border-black"
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase">
                  URL Slug (Test Link: /exam/{"<slug>"})
                </Label>
                <Input
                  value={editExam.slug}
                  onChange={(e) => setEditExam({ ...editExam, slug: e.target.value })}
                  required
                  placeholder="e.g. code-matrix-r1"
                  className="font-mono text-xs rounded-none border-2 border-black"
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase">Short Description</Label>
                <Input
                  value={editExam.description}
                  onChange={(e) => setEditExam({ ...editExam, description: e.target.value })}
                  placeholder="e.g. Technical round testing core C, Python and Data Structures"
                  className="rounded-none border-2 border-black text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase">Custom Rules / Instructions</Label>
                <textarea
                  value={editExam.rules}
                  onChange={(e) => setEditExam({ ...editExam, rules: e.target.value })}
                  rows={2}
                  placeholder="Optional guidelines displayed to candidates during onboarding"
                  className="w-full p-2 border-2 border-black text-xs font-sans bg-white dark:bg-zinc-900 rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={editExam.durationMinutes}
                    onChange={(e) => setEditExam({ ...editExam, durationMinutes: Number(e.target.value) })}
                    required
                    className="rounded-none border-2 border-black font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Questions per Candidate</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={editExam.totalQuestionsToAsk}
                    onChange={(e) => setEditExam({ ...editExam, totalQuestionsToAsk: Number(e.target.value) })}
                    required
                    className="rounded-none border-2 border-black font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Min Team Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={editExam.minTeamSize}
                    onChange={(e) => setEditExam({ ...editExam, minTeamSize: Number(e.target.value) })}
                    required
                    className="rounded-none border-2 border-black font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Max Team Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={editExam.maxTeamSize}
                    onChange={(e) => setEditExam({ ...editExam, maxTeamSize: Number(e.target.value) })}
                    required
                    className="rounded-none border-2 border-black font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Contest Type</Label>
                  <select
                    value={editExam.type}
                    onChange={(e) => setEditExam({ ...editExam, type: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="MCQ">MCQ Contest (Multiple Choice)</option>
                    <option value="CODING">Coding Contest (Monaco Editor & Judge)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Contest Status</Label>
                  <select
                    value={editExam.status}
                    onChange={(e) => setEditExam({ ...editExam, status: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="LIVE">LIVE (Accepting Submissions)</option>
                    <option value="DRAFT">DRAFT (Locked for Students)</option>
                    <option value="ENDED">ENDED (Closed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Access PIN / Code</Label>
                  <Input
                    value={editExam.accessCode}
                    onChange={(e) => setEditExam({ ...editExam, accessCode: e.target.value })}
                    placeholder="Leave blank for open access"
                    className="rounded-none border-2 border-black text-sm"
                  />
                </div>
                {currentUser?.role === "SUPER_ADMIN" && (
                  <div>
                    <Label className="text-xs font-black uppercase">Assigned Organizer</Label>
                    <select
                      value={editExam.adminId || ""}
                      onChange={(e) => setEditExam({ ...editExam, adminId: e.target.value })}
                      className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                    >
                      <option value="">Unassigned</option>
                      {adminsList.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.name} (@{adm.username}) - {adm.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditExamModal(false)}
                  className="w-1/3 py-5 font-bold uppercase rounded-none border-2 border-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-2/3 py-5 font-black uppercase rounded-none border-2 border-black bg-black text-white hover:bg-zinc-800"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Edit Question */}
      {editQuestion && (
        <Dialog open={showEditQuestionModal} onOpenChange={setShowEditQuestionModal}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Edit Question Details
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateQuestion} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-black uppercase">Question Text</Label>
                <Input
                  value={editQuestion.question}
                  onChange={(e) => setEditQuestion({ ...editQuestion, question: e.target.value })}
                  required
                  placeholder="Enter the MCQ question"
                  className="font-bold rounded-none border-2 border-black"
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase">Optional Code Block (for Programming/Output)</Label>
                <textarea
                  value={editQuestion.codeSnippet}
                  onChange={(e) => setEditQuestion({ ...editQuestion, codeSnippet: e.target.value })}
                  rows={3}
                  placeholder="Paste code snippet here..."
                  className="w-full p-2 border-2 border-black font-mono text-xs bg-zinc-950 text-emerald-400 rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase">Option A</Label>
                  <Input
                    value={editQuestion.optionA}
                    onChange={(e) => setEditQuestion({ ...editQuestion, optionA: e.target.value })}
                    required
                    placeholder="Option A text"
                    className="rounded-none border border-black text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Option B</Label>
                  <Input
                    value={editQuestion.optionB}
                    onChange={(e) => setEditQuestion({ ...editQuestion, optionB: e.target.value })}
                    required
                    placeholder="Option B text"
                    className="rounded-none border border-black text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Option C</Label>
                  <Input
                    value={editQuestion.optionC}
                    onChange={(e) => setEditQuestion({ ...editQuestion, optionC: e.target.value })}
                    required
                    placeholder="Option C text"
                    className="rounded-none border border-black text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Option D</Label>
                  <Input
                    value={editQuestion.optionD}
                    onChange={(e) => setEditQuestion({ ...editQuestion, optionD: e.target.value })}
                    required
                    placeholder="Option D text"
                    className="rounded-none border border-black text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-black uppercase">Correct Answer</Label>
                  <Input
                    value={editQuestion.answer}
                    onChange={(e) => setEditQuestion({ ...editQuestion, answer: e.target.value })}
                    required
                    placeholder="Exact text or option"
                    className="font-bold border-2 border-black text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Category</Label>
                  <Input
                    value={editQuestion.category}
                    onChange={(e) => setEditQuestion({ ...editQuestion, category: e.target.value })}
                    required
                    placeholder="e.g. DBMS, OS, Output"
                    className="border-2 border-black text-sm font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editQuestion.points}
                    onChange={(e) => setEditQuestion({ ...editQuestion, points: Number(e.target.value) })}
                    className="border-2 border-black text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditQuestionModal(false)}
                  className="w-1/3 py-5 font-bold uppercase rounded-none border-2 border-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-2/3 py-5 font-black uppercase rounded-none border-2 border-black bg-black text-white hover:bg-zinc-800"
                >
                  Update Question
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Edit Programming Problem */}
      {editProblem && (
        <Dialog open={showEditProblemModal} onOpenChange={setShowEditProblemModal}>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto border-4 border-black rounded-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-500" /> Edit Programming Problem
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProblem} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-black uppercase">Problem Title</Label>
                <Input
                  value={editProblem.title}
                  onChange={(e) => setEditProblem({ ...editProblem, title: e.target.value })}
                  required
                  placeholder="e.g. Invert Binary Tree"
                  className="font-bold rounded-none border-2 border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Difficulty</Label>
                  <select
                    value={editProblem.difficulty}
                    onChange={(e) => setEditProblem({ ...editProblem, difficulty: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Score / Points</Label>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={editProblem.points}
                    onChange={(e) => setEditProblem({ ...editProblem, points: Number(e.target.value) })}
                    required
                    className="rounded-none border-2 border-black font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase">Problem Description</Label>
                <textarea
                  value={editProblem.description}
                  onChange={(e) => setEditProblem({ ...editProblem, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Problem description and rules..."
                  className="w-full p-2.5 border-2 border-black font-sans text-sm bg-white dark:bg-zinc-900 rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase">Input Format</Label>
                  <textarea
                    value={editProblem.inputFormat}
                    onChange={(e) => setEditProblem({ ...editProblem, inputFormat: e.target.value })}
                    rows={2}
                    placeholder="Input format description"
                    className="w-full p-2 border-2 border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase">Output Format</Label>
                  <textarea
                    value={editProblem.outputFormat}
                    onChange={(e) => setEditProblem({ ...editProblem, outputFormat: e.target.value })}
                    rows={2}
                    placeholder="Output format description"
                    className="w-full p-2 border-2 border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase">Constraints</Label>
                <Input
                  value={editProblem.constraints}
                  onChange={(e) => setEditProblem({ ...editProblem, constraints: e.target.value })}
                  placeholder="e.g. 1 <= N <= 10^5"
                  className="font-mono text-xs rounded-none border-2 border-black"
                />
              </div>

              {/* Test Cases Builder */}
              <div className="pt-2 border-t-2 border-black/10">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-sm font-black uppercase">
                    Test Cases ({editProblem.testCases.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditProblem({
                        ...editProblem,
                        testCases: [
                          ...editProblem.testCases,
                          { input: "", expectedOutput: "", isHidden: true, explanation: "" },
                        ],
                      })
                    }
                    className="font-bold text-xs border border-black rounded-none"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Test Case
                  </Button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {editProblem.testCases.map((tc: any, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-black space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs uppercase text-zinc-600">
                          Test Case #{idx + 1} {tc.isHidden ? "(Hidden Evaluation)" : "(Visible Sample)"}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tc.isHidden}
                              onChange={(e) => {
                                const updated = [...editProblem.testCases];
                                updated[idx].isHidden = e.target.checked;
                                setEditProblem({ ...editProblem, testCases: updated });
                              }}
                            />
                            Hidden
                          </label>
                          {editProblem.testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editProblem.testCases.filter((_: any, i: number) => i !== idx);
                                setEditProblem({ ...editProblem, testCases: updated });
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] font-bold uppercase text-zinc-500">Standard Input</Label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...editProblem.testCases];
                              updated[idx].input = e.target.value;
                              setEditProblem({ ...editProblem, testCases: updated });
                            }}
                            required
                            rows={2}
                            placeholder="Input stdin..."
                            className="w-full p-1.5 border border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase text-zinc-500">Expected Output</Label>
                          <textarea
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...editProblem.testCases];
                              updated[idx].expectedOutput = e.target.value;
                              setEditProblem({ ...editProblem, testCases: updated });
                            }}
                            required
                            rows={2}
                            placeholder="Expected stdout..."
                            className="w-full p-1.5 border border-black text-xs font-mono bg-white dark:bg-zinc-900 rounded-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditProblemModal(false)}
                  className="w-1/3 py-5 font-bold uppercase rounded-none border-2 border-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-2/3 py-5 font-black uppercase rounded-none border-2 border-black bg-black text-white hover:bg-zinc-800"
                >
                  Save Problem Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Edit Admin / Event Organizer */}
      {editAdmin && (
        <Dialog open={showEditAdminModal} onOpenChange={setShowEditAdminModal}>
          <DialogContent className="max-w-md border-4 border-black rounded-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Edit Admin / Organizer Account
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateAdmin} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-black uppercase">Full Name</Label>
                <Input
                  value={editAdmin.name}
                  onChange={(e) => setEditAdmin({ ...editAdmin, name: e.target.value })}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="font-bold rounded-none border-2 border-black"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">Username</Label>
                <Input
                  value={editAdmin.username}
                  onChange={(e) => setEditAdmin({ ...editAdmin, username: e.target.value })}
                  required
                  placeholder="e.g. rahul_organizer"
                  className="font-mono text-xs rounded-none border-2 border-black"
                />
              </div>
              <div>
                <Label className="text-xs font-black uppercase">New Password (Leave blank to keep current)</Label>
                <Input
                  type="password"
                  value={editAdmin.password}
                  onChange={(e) => setEditAdmin({ ...editAdmin, password: e.target.value })}
                  placeholder="Optional new password"
                  className="rounded-none border-2 border-black"
                />
              </div>
              {currentUser?.role === "SUPER_ADMIN" && (
                <div>
                  <Label className="text-xs font-black uppercase">Role & Permissions</Label>
                  <select
                    value={editAdmin.role}
                    onChange={(e) => setEditAdmin({ ...editAdmin, role: e.target.value })}
                    className="w-full p-2 border-2 border-black font-bold text-sm bg-white dark:bg-zinc-900 rounded-none"
                  >
                    <option value="EVENT_ORGANIZER">EVENT ORGANIZER (Admin for assigned events)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full system access)</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditAdminModal(false)}
                  className="w-1/3 py-5 font-bold uppercase rounded-none border-2 border-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-2/3 py-5 font-black uppercase rounded-none border-2 border-black bg-black text-white hover:bg-zinc-800"
                >
                  Update Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
