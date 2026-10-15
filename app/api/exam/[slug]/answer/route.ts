/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { teamid, qid, answer } = await req.json();

    if (!teamid || !qid || answer === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await prisma.answer.upsert({
      where: { teamId_qid: { teamId: teamid, qid } },
      update: { answer: String(answer) },
      create: { teamId: teamid, qid, answer: String(answer) },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
