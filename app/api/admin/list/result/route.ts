/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        answers: true
      },
      orderBy: [
        { disqualified: "asc" },
        { quizscore: "desc" },
        { endTime: "asc" }
      ]
    });

    // Fetch all questions to map them for detailed view
    const allQuestions = await prisma.question.findMany();

    // Convert BigInt to Number for JSON serialization and map answers
    const serializedTeams = teams.map((team) => {
      const mappedAnswers = team.answers.map(ans => {
        const fullQ = allQuestions.find(q => q.id === ans.qid);
        return {
          ...ans,
          question: fullQ || { question: "Unknown", answer: "N/A" }
        };
      });

      return {
        ...team,
        startTime: team.startTime ? Number(team.startTime) : null,
        endTime: team.endTime ? Number(team.endTime) : null,
        answers: mappedAnswers
      };
    });

    return NextResponse.json({ success: true, teams: serializedTeams });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids, pin } = await req.json();

    if (pin !== "3010") {
      return NextResponse.json(
        { success: false, message: "Invalid PIN" },
        { status: 403 }
      );
    }

    if (ids && ids.length > 0) {
      // Bulk delete selected
      await prisma.team.deleteMany({
        where: { id: { in: ids } }
      });
      return NextResponse.json({ success: true, message: "Selected teams deleted" });
    } else {
      // Delete all
      await prisma.team.deleteMany({});
      return NextResponse.json({ success: true, message: "All teams deleted" });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
