/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["LIVE", "UPCOMING", "DRAFT", "ENDED"] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        description: true,
        durationMinutes: true,
        totalQuestionsToAsk: true,
        minTeamSize: true,
        maxTeamSize: true,
        status: true,
        _count: {
          select: {
            teams: true,
            questions: true,
            problems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, exams });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
