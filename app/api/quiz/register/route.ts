/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { teamname, participants } = await req.json();

  try {
    const team = await prisma.team.create({
      data: {
        teamname,
        members: {
          create: participants,
        },
        answers: [],
      },
    });

    return NextResponse.json({
      success: true,
      team: { ...team, members: participants },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}
