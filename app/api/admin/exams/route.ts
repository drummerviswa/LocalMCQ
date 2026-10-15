/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin, isSuperAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // RBAC: SuperAdmin sees all exams; Event Organizer sees only their own exams
    const whereClause = isSuperAdmin(admin) ? {} : { adminId: admin.id };

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            questions: true,
            problems: true,
            teams: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, exams, userRole: admin.role });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      type,
      description,
      rules,
      durationMinutes,
      totalQuestionsToAsk,
      minTeamSize,
      maxTeamSize,
      status,
      accessCode,
      assignedAdminId,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, message: "Title and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

    const existingExam = await prisma.exam.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingExam) {
      return NextResponse.json(
        { success: false, message: "Exam link slug already exists. Choose a unique one." },
        { status: 400 }
      );
    }

    // If SuperAdmin, can assign to another Event Organizer or keep self
    const targetAdminId = isSuperAdmin(admin) && assignedAdminId ? assignedAdminId : admin.id;

    const exam = await prisma.exam.create({
      data: {
        title,
        slug: cleanSlug,
        type: type === "CODING" ? "CODING" : "MCQ",
        description: description || "",
        rules: rules || "",
        durationMinutes: Number(durationMinutes) || 15,
        totalQuestionsToAsk: Number(totalQuestionsToAsk) || 20,
        minTeamSize: Number(minTeamSize) || 1,
        maxTeamSize: Number(maxTeamSize) || 2,
        status: status || "LIVE",
        accessCode: accessCode || null,
        adminId: targetAdminId,
      },
    });

    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
