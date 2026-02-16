import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { teamid } = await req.json();

    if (!teamid) {
      return NextResponse.json(
        { success: false, message: "Team ID required" },
        { status: 400 }
      );
    }

    // Check if quiz already started (idempotency)
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamid },
      select: { startTime: true, questions: true },
    });

    if (existingTeam?.startTime) {
      // Quiz already started, return existing questions in the same order
      const questionIds = existingTeam.questions as string[];
      const questionsFetch = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, question: true, options: true },
      });

      // Maintain order
      const questions = questionIds.map(id => questionsFetch.find(q => q.id === id)).filter(Boolean);

      return NextResponse.json({
        questions,
        startTime: Number(existingTeam.startTime),
      });
    }

    // First time starting quiz - Smart Selection
    const allQuestions = await prisma.question.findMany();

    // Group by category
    const categorized: Record<string, any[]> = {};
    allQuestions.forEach(q => {
      if (!categorized[q.category]) categorized[q.category] = [];
      categorized[q.category].push(q);
    });

    const selectedQuestions: any[] = [];
    const categories = Object.keys(categorized);

    // 1. Pick 1 question from each of 10 categories
    categories.forEach(cat => {
      const catQuestions = categorized[cat];
      const randomQ = catQuestions[Math.floor(Math.random() * catQuestions.length)];
      selectedQuestions.push(randomQ);
    });

    // 2. Pick 10 more questions randomly from the remaining pool
    const remainingPool = allQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
    const extraShuffled = shuffle(remainingPool).slice(0, 10);
    selectedQuestions.push(...extraShuffled);

    // Final shuffle of the 20 questions
    const finalSelection = shuffle(selectedQuestions);

    const startTime = Date.now();

    await prisma.team.update({
      where: { id: teamid },
      data: {
        questions: finalSelection.map((q) => q.id),
        startTime: BigInt(startTime),
      },
    });

    const safe = finalSelection.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({ questions: safe, startTime });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// Fisher-Yates shuffle for better randomization
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
