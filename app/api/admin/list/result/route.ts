/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/list/result/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
      },
    });

    return NextResponse.json({ success: true, teams });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    // delete children first
    await prisma.participant.deleteMany({});
    await prisma.team.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All teams and participants deleted",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}