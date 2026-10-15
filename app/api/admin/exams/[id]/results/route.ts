/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin, isSuperAdmin } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            questions: true,
            problems: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (!isSuperAdmin(admin) && exam.adminId !== admin.id) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const isCoding = exam.type === "CODING";

    // Ordering logic with tie-breakers
    const orderByClause = isCoding
      ? [
          { disqualified: "asc" as const },
          { codingScore: "desc" as const },      // 1. Primary: Coding Score
          { totalPassedCases: "desc" as const }, // 2. Secondary: Test cases passed
          { penaltyTime: "asc" as const },       // 3. Tertiary: Speed/Time penalty
          { submissionCount: "asc" as const },   // 4. Quaternary: Fewer submissions = better accuracy
        ]
      : [
          { disqualified: "asc" as const },
          { quizscore: "desc" as const },
          { endTime: "asc" as const },
        ];

    const teams = await prisma.team.findMany({
      where: { examId },
      include: {
        members: true,
        answers: true,
        submissions: {
          include: {
            problem: {
              select: { id: true, title: true, points: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: orderByClause,
    });

    const questions = await prisma.question.findMany({
      where: { examId },
    });

    const serializedTeams = teams.map((team) => {
      const mappedAnswers = team.answers.map((ans) => {
        const fullQ = questions.find((q) => q.id === ans.qid);
        return {
          ...ans,
          question: fullQ || { question: "Deleted question", answer: "N/A", category: "General" },
        };
      });

      return {
        ...team,
        startTime: team.startTime ? Number(team.startTime) : null,
        endTime: team.endTime ? Number(team.endTime) : null,
        penaltyTime: team.penaltyTime ? Number(team.penaltyTime) : null,
        answers: mappedAnswers,
      };
    });

    return NextResponse.json({
      success: true,
      exam,
      teams: serializedTeams,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { adminId: true },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (!isSuperAdmin(admin) && exam.adminId !== admin.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { ids } = await req.json();

    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.team.deleteMany({
        where: {
          id: { in: ids },
          examId,
        },
      });
      return NextResponse.json({ success: true, message: "Selected teams deleted" });
    } else {
      await prisma.team.deleteMany({
        where: { examId },
      });
      return NextResponse.json({ success: true, message: "All teams deleted for this exam" });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
