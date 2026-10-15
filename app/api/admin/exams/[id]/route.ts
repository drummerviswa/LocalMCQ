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

    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            teams: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    // RBAC: Event Organizer can only view their own exam details
    if (!isSuperAdmin(admin) && exam.adminId !== admin.id) {
      return NextResponse.json({ success: false, message: "Access forbidden to this event" }, { status: 403 });
    }

    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingExam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (!isSuperAdmin(admin) && existingExam.adminId !== admin.id) {
      return NextResponse.json({ success: false, message: "Access forbidden" }, { status: 403 });
    }

    // If slug is being updated, verify it doesn't conflict with another exam
    if (body.slug && body.slug !== existingExam.slug) {
      const slugConflict = await prisma.exam.findUnique({
        where: { slug: body.slug.trim().toLowerCase() },
      });
      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json(
          { success: false, message: "Slug is already taken by another contest" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existingExam.title,
        slug: body.slug !== undefined ? body.slug.trim().toLowerCase() : existingExam.slug,
        type: body.type !== undefined ? body.type : existingExam.type,
        description: body.description !== undefined ? body.description : existingExam.description,
        rules: body.rules !== undefined ? body.rules : existingExam.rules,
        durationMinutes:
          body.durationMinutes !== undefined
            ? Number(body.durationMinutes)
            : existingExam.durationMinutes,
        totalQuestionsToAsk:
          body.totalQuestionsToAsk !== undefined
            ? Number(body.totalQuestionsToAsk)
            : existingExam.totalQuestionsToAsk,
        minTeamSize:
          body.minTeamSize !== undefined
            ? Number(body.minTeamSize)
            : existingExam.minTeamSize,
        maxTeamSize:
          body.maxTeamSize !== undefined
            ? Number(body.maxTeamSize)
            : existingExam.maxTeamSize,
        status: body.status !== undefined ? body.status : existingExam.status,
        accessCode:
          body.accessCode !== undefined
            ? body.accessCode
              ? String(body.accessCode).trim()
              : null
            : existingExam.accessCode,
        adminId:
          isSuperAdmin(admin) && body.adminId !== undefined
            ? body.adminId || null
            : undefined,
      },
    });

    return NextResponse.json({ success: true, exam: updated });
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

    const existingExam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (!isSuperAdmin(admin) && existingExam.adminId !== admin.id) {
      return NextResponse.json({ success: false, message: "Access forbidden" }, { status: 403 });
    }

    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
