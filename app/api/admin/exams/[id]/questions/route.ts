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
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const questions = await prisma.question.findMany({
      where: { examId: id },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, questions });
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

    const { id } = await params;

    const hasAccess = await verifyExamAccess(id, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const body = await req.json();
    const { question, options, answer, category, codeSnippet, points } = body;

    if (!question || !options || !answer) {
      return NextResponse.json(
        { success: false, message: "Question text, options, and answer are required" },
        { status: 400 }
      );
    }

    const created = await prisma.question.create({
      data: {
        question: question.trim(),
        options: Array.isArray(options) ? options : [options],
        answer: String(answer).trim(),
        category: category || "General",
        codeSnippet: codeSnippet || null,
        points: Number(points) || 1,
        examId: id,
      },
    });

    return NextResponse.json({ success: true, question: created });
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

    const { id } = await params;

    const hasAccess = await verifyExamAccess(id, admin);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Forbidden: Not your assigned event" }, { status: 403 });
    }

    const { questionIds } = await req.json();

    if (Array.isArray(questionIds) && questionIds.length > 0) {
      await prisma.question.deleteMany({
        where: {
          id: { in: questionIds },
          examId: id,
        },
      });
      return NextResponse.json({ success: true, message: "Selected questions deleted" });
    } else {
      await prisma.question.deleteMany({
        where: { examId: id },
      });
      return NextResponse.json({ success: true, message: "All questions deleted for this exam" });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
