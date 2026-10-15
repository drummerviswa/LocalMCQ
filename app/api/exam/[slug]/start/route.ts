/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { teamid } = await req.json();

    if (!teamid) {
      return NextResponse.json({ success: false, message: "Team ID required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamid },
      select: { id: true, examId: true, startTime: true, questions: true, disqualified: true },
    });

    if (!team || team.examId !== exam.id) {
      return NextResponse.json({ success: false, message: "Team not found for this exam" }, { status: 404 });
    }

    if (team.disqualified) {
      return NextResponse.json({ success: false, message: "Team is disqualified" }, { status: 403 });
    }

    // ================= BRANCH: CODING CONTEST =================
    if (exam.type === "CODING") {
      const problems = await prisma.problem.findMany({
        where: { examId: exam.id },
        include: {
          testCases: {
            where: { isHidden: false }, // Only return sample test cases to candidate
            select: { id: true, input: true, expectedOutput: true, isHidden: true, explanation: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Also fetch candidate's latest submissions for each problem
      const latestSubmissions = await prisma.submission.findMany({
        where: { teamId: team.id },
        orderBy: { submittedAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        examType: "CODING",
        problems,
        durationMinutes: exam.durationMinutes,
        startTime: team.startTime ? Number(team.startTime) : null,
        submissions: latestSubmissions,
      });
    }

    // ================= BRANCH: MCQ QUIZ =================
    // 1. If quiz already started, return existing questions
    if (team.startTime && Array.isArray(team.questions) && team.questions.length > 0) {
      const questionIds = team.questions as string[];
      const questionsFetch = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, question: true, options: true, codeSnippet: true, category: true, points: true },
      });

      const questions = questionIds
        .map((qid) => questionsFetch.find((q) => q.id === qid))
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        examType: "MCQ",
        questions,
        durationMinutes: exam.durationMinutes,
        startTime: Number(team.startTime),
      });
    }

    // 2. First time starting MCQ: fetch pool from this exam
    let pool = await prisma.question.findMany({
      where: { examId: exam.id },
    });

    // Fallback: If this exam doesn't have custom questions yet, use the global pool
    if (pool.length === 0) {
      pool = await prisma.question.findMany({
        where: { examId: null },
      });
    }

    if (pool.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No questions uploaded for this exam yet. Please contact the administrator.",
        },
        { status: 400 }
      );
    }

    const targetCount = Math.min(exam.totalQuestionsToAsk || 20, pool.length);
    const selected = shuffle(pool).slice(0, targetCount);

    await prisma.team.update({
      where: { id: teamid },
      data: {
        questions: selected.map((q) => q.id),
      },
    });

    const safeQuestions = selected.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      codeSnippet: q.codeSnippet,
      category: q.category,
      points: q.points,
    }));

    return NextResponse.json({
      success: true,
      examType: "MCQ",
      questions: safeQuestions,
      durationMinutes: exam.durationMinutes,
      startTime: null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
