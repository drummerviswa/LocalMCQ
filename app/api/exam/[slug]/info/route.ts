/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const exam = await prisma.exam.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        rules: true,
        type: true,
        durationMinutes: true,
        totalQuestionsToAsk: true,
        minTeamSize: true,
        maxTeamSize: true,
        status: true,
        accessCode: true,
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

    return NextResponse.json({
      success: true,
      exam: {
        ...exam,
        requiresAccessCode: !!exam.accessCode,
        accessCode: undefined, // Don't expose the actual code
        totalAvailableQuestions: exam._count.questions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
