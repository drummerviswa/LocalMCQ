/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { teamid } = await req.json();

    if (!teamid) {
      return NextResponse.json({ success: false, message: "Team ID required" }, { status: 400 });
    }

    const currentTeam = await prisma.team.findUnique({
      where: { id: teamid },
    });

    if (!currentTeam) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    const newStrikes = currentTeam.strikes + 1;
    const isDisqualified = newStrikes >= 3;

    const team = await prisma.team.update({
      where: { id: teamid },
      data: {
        strikes: newStrikes,
        disqualified: isDisqualified,
      },
    });

    return NextResponse.json({
      success: true,
      strikes: team.strikes,
      disqualified: team.disqualified,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
