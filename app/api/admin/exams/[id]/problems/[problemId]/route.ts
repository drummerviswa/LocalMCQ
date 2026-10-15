/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin, isSuperAdmin } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; problemId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, problemId } = await params;

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

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: true,
      },
    });

    if (!problem || problem.examId !== examId) {
      return NextResponse.json({ success: false, message: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, problem });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; problemId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, problemId } = await params;

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

    const existing = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!existing || existing.examId !== examId) {
      return NextResponse.json({ success: false, message: "Problem not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      difficulty,
      points,
      constraints,
      inputFormat,
      outputFormat,
      testCases,
    } = body;

    const updated = await prisma.problem.update({
      where: { id: problemId },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description) : existing.description,
        difficulty: difficulty !== undefined ? String(difficulty) : existing.difficulty,
        points: points !== undefined ? Number(points) : existing.points,
        constraints: constraints !== undefined ? (constraints ? String(constraints) : null) : existing.constraints,
        inputFormat: inputFormat !== undefined ? (inputFormat ? String(inputFormat) : null) : existing.inputFormat,
        outputFormat: outputFormat !== undefined ? (outputFormat ? String(outputFormat) : null) : existing.outputFormat,
      },
    });

    // If testCases provided, update them
    if (Array.isArray(testCases)) {
      // Delete old test cases and insert updated ones
      await prisma.testCase.deleteMany({
        where: { problemId },
      });

      if (testCases.length > 0) {
        await prisma.testCase.createMany({
          data: testCases.map((tc: any) => ({
            problemId,
            input: String(tc.input ?? ""),
            expectedOutput: String(tc.expectedOutput ?? "").trim(),
            isHidden: Boolean(tc.isHidden),
            explanation: tc.explanation ? String(tc.explanation) : null,
          })),
        });
      }
    }

    const refreshed = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    });

    return NextResponse.json({ success: true, problem: refreshed });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; problemId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, problemId } = await params;

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

    await prisma.problem.delete({
      where: { id: problemId },
    });

    return NextResponse.json({ success: true, message: "Problem deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
