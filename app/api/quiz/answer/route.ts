import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { teamid, qid, answer } = await req.json();

    if (!teamid || !qid || !answer) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await prisma.answer.upsert({
      where: { teamId_qid: { teamId: teamid, qid } },
      update: { answer },
      create: { teamId: teamid, qid, answer },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
