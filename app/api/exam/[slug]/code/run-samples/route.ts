/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { judgeCode } from "@/lib/codeJudge";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { problemId, language, code } = await req.json();

    if (!problemId || !code || !language) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    // Fetch visible test cases only
    const testCases = await prisma.testCase.findMany({
      where: {
        problemId,
        isHidden: false,
      },
      select: {
        id: true,
        input: true,
        expectedOutput: true,
        isHidden: true,
      },
    });

    if (testCases.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No sample test cases configured for this problem.",
      }, { status: 400 });
    }

    const judgeResult = await judgeCode(language, code, testCases);

    return NextResponse.json({
      success: true,
      ...judgeResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
