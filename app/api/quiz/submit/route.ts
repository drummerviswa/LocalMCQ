// app/api/quiz/submit/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { teamid, answers, score, questions, timeTaken } = await req.json();

  if (!teamid) {
    return NextResponse.json(
      { success: false, message: "Missing teamid" },
      { status: 400 }
    );
  }

  await prisma.team.update({
    where: { id: teamid },
    data: {
      questions,              // ✅ now valid JSON
      answers,                // ✅ now valid JSON
      quizscore: score.toString(),
      timeTaken: timeTaken.toString(), // ✅ correct field
    },
  });

  return NextResponse.json({ success: true });
}
