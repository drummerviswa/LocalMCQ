/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { teamname, participants, accessCode } = await req.json();

    const exam = await prisma.exam.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "LIVE") {
      return NextResponse.json(
        { success: false, message: `This exam is currently ${exam.status.toLowerCase()}. Registration is closed.` },
        { status: 403 }
      );
    }

    if (exam.accessCode && exam.accessCode.trim() !== (accessCode || "").trim()) {
      return NextResponse.json({ success: false, message: "Invalid exam access code" }, { status: 403 });
    }

    if (!teamname || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ success: false, message: "Invalid team registration data" }, { status: 400 });
    }

    const minSize = exam.minTeamSize || 1;
    const maxSize = exam.maxTeamSize || 2;

    if (participants.length < minSize || participants.length > maxSize) {
      return NextResponse.json(
        { success: false, message: `Team must have between ${minSize} and ${maxSize} participant(s).` },
        { status: 400 }
      );
    }

    // Check unique team name within this exam
    const existingTeam = await prisma.team.findFirst({
      where: {
        teamname: teamname.trim(),
        examId: exam.id,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, message: "Team name already taken in this exam. Please choose another." },
        { status: 400 }
      );
    }

    // Check if participant already registered in this exam
    const existingParticipants = await prisma.member.findMany({
      where: {
        Team: { examId: exam.id },
        OR: participants.map((p: any) => ({
          regno: p.regno.trim(),
          mobileno: p.mobileno.trim(),
        })),
      },
    });

    if (existingParticipants.length > 0) {
      return NextResponse.json(
        { success: false, message: "One or more participants are already registered in this exam." },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        teamname: teamname.trim(),
        examId: exam.id,
        members: {
          create: participants.map((p: any) => ({
            name: p.name.trim(),
            mobileno: p.mobileno.trim(),
            regno: p.regno.trim(),
            department: p.department.trim(),
            course: p.course.trim(),
            branch: p.branch.trim(),
          })),
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({
      success: true,
      team,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
