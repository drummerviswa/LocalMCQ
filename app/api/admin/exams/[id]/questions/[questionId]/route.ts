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
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, questionId } = await params;

    const hasAccess = await verifyExamAccess(examId, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.examId !== examId) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, question });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, questionId } = await params;

    const hasAccess = await verifyExamAccess(examId, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existing || existing.examId !== examId) {
      return NextResponse.json({ success: false, message: "Question not found in this exam" }, { status: 404 });
    }

    const body = await req.json();
    const { question, options, answer, category, codeSnippet, points } = body;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        question: question !== undefined ? String(question).trim() : existing.question,
        options: options !== undefined ? (Array.isArray(options) ? options : [options]) : (existing.options as any),
        answer: answer !== undefined ? String(answer).trim() : existing.answer,
        category: category !== undefined ? String(category) : existing.category,
        codeSnippet: codeSnippet !== undefined ? (codeSnippet ? String(codeSnippet) : null) : existing.codeSnippet,
        points: points !== undefined ? Number(points) : existing.points,
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId, questionId } = await params;

    const hasAccess = await verifyExamAccess(examId, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existing || existing.examId !== examId) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
