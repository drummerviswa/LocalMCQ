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

    const team = await prisma.team.findUnique({
      where: { id: teamid },
      include: { answers: true },
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    const questionIds = (team.questions as string[]) || [];

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, answer: true, points: true },
    });

    let score = 0;
    let totalPossible = 0;

    questions.forEach((q) => {
      const pts = q.points || 1;
      totalPossible += pts;
      const userAns = team.answers.find((a) => a.qid === q.id);
      if (userAns && userAns.answer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        score += pts;
      }
    });

    await prisma.team.update({
      where: { id: teamid },
      data: {
        quizscore: score,
        endTime: BigInt(Date.now()),
      },
    });

    return NextResponse.json({
      success: true,
      score,
      totalPossible,
      showScoreOnSubmit: exam?.showScoreOnSubmit ?? false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
