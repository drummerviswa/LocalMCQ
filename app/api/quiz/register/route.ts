/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { teamname, participants } = await req.json();

    if (!teamname || !participants || participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: "Invalid team data" },
        { status: 400 }
      );
    }

    const existingTeam = await prisma.team.findFirst({
      where: { teamname },
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, message: "Team name already exists" },
        { status: 400 }
      );
    }

    // Check if any participant is already registered
    const existingParticipants = await prisma.member.findMany({
      where: {
        OR: participants.map((p: any) => ({
          regno: p.regno,
          mobileno: p.mobileno,
        })),
      },
    });

    if (existingParticipants.length > 0) {
      return NextResponse.json(
        { success: false, message: "One or more participants are already registered" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        teamname,
        members: {
          create: participants,
        },
      },
    });

    return NextResponse.json({
      success: true,
      team: { ...team, members: participants },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
}
