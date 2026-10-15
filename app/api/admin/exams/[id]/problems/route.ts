/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin, isSuperAdmin } from "@/lib/auth";

async function verifyExamAccess(examId: string, admin: any) {
  if (isSuperAdmin(admin)) return true;
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { adminId: true },
  });
  return exam?.adminId === admin.id;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hasAccess = await verifyExamAccess(id, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const problems = await prisma.problem.findMany({
      where: { examId: id },
      include: {
        testCases: true,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, problems });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;
    const hasAccess = await verifyExamAccess(examId, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      difficulty,
      constraints,
      inputFormat,
      outputFormat,
      starterCode,
      points,
      testCases,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: "Title and description are required" }, { status: 400 });
    }

    const problem = await prisma.problem.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        difficulty: difficulty || "Medium",
        constraints: constraints || null,
        inputFormat: inputFormat || null,
        outputFormat: outputFormat || null,
        starterCode: starterCode || null,
        points: Number(points) || 100,
        examId,
        testCases: {
          create: Array.isArray(testCases)
            ? testCases.map((tc: any) => ({
                input: String(tc.input || "").trim(),
                expectedOutput: String(tc.expectedOutput || "").trim(),
                isHidden: !!tc.isHidden,
                explanation: tc.explanation || null,
              }))
            : [],
        },
      },
      include: {
        testCases: true,
      },
    });

    return NextResponse.json({ success: true, problem });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
