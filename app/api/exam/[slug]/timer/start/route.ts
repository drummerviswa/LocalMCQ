/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { teamid } = await req.json();

    if (!teamid) {
      return NextResponse.json({ success: false, message: "Team ID required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamid },
      select: { startTime: true },
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    // Idempotent: don't overwrite if already started
    if (team.startTime) {
      return NextResponse.json({
        success: true,
        startTime: Number(team.startTime),
      });
    }

    const now = BigInt(Date.now());
    const updated = await prisma.team.update({
      where: { id: teamid },
      data: { startTime: now },
      select: { startTime: true },
    });

    return NextResponse.json({
      success: true,
      startTime: Number(updated.startTime),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
