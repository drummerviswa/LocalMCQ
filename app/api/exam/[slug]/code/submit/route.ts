/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { judgeCode } from "@/lib/codeJudge";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { teamid, problemId, language, code } = await req.json();

    if (!teamid || !problemId || !code || !language) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true, durationMinutes: true },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamid },
      select: { id: true, startTime: true, disqualified: true },
    });

    if (!team || team.disqualified) {
      return NextResponse.json({ success: false, message: "Unauthorized or disqualified" }, { status: 403 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    });

    if (!problem) {
      return NextResponse.json({ success: false, message: "Problem not found" }, { status: 404 });
    }

    const totalCases = problem.testCases.length;
    if (totalCases === 0) {
      return NextResponse.json({ success: false, message: "No test cases configured for this problem" }, { status: 400 });
    }

    // Run judge across ALL test cases (visible + hidden)
    const judge = await judgeCode(language, code, problem.testCases);

    // Calculate score based on ratio of passed test cases
    const pointsPerCase = problem.points / totalCases;
    const earnedScore = Math.round(judge.passedCount * pointsPerCase);

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        teamId: team.id,
        problemId: problem.id,
        code,
        language,
        status: judge.status,
        testCasesPassed: judge.passedCount,
        totalTestCases: totalCases,
        score: earnedScore,
        executionTimeMs: judge.totalTimeMs,
      },
    });

    // Calculate tie-breaking penalty time (elapsed time since start)
    const now = Date.now();
    const elapsedSeconds = team.startTime ? Math.max(0, Math.floor((now - Number(team.startTime)) / 1000)) : 0;

    // Fetch all submissions by this team for this exam's problems to get MAX score per problem
    const allProblems = await prisma.problem.findMany({
      where: { examId: exam.id },
      select: { id: true },
    });
    const problemIds = allProblems.map((p) => p.id);

    const teamSubmissions = await prisma.submission.findMany({
      where: {
        teamId: team.id,
        problemId: { in: problemIds },
      },
    });

    // Best score and best passed test cases per problem
    const bestPerProblem: Record<string, { maxScore: number; maxPassed: number }> = {};
    for (const sub of teamSubmissions) {
      if (!bestPerProblem[sub.problemId]) {
        bestPerProblem[sub.problemId] = { maxScore: sub.score, maxPassed: sub.testCasesPassed };
      } else {
        bestPerProblem[sub.problemId].maxScore = Math.max(bestPerProblem[sub.problemId].maxScore, sub.score);
        bestPerProblem[sub.problemId].maxPassed = Math.max(bestPerProblem[sub.problemId].maxPassed, sub.testCasesPassed);
      }
    }

    const totalCodingScore = Object.values(bestPerProblem).reduce((acc, curr) => acc + curr.maxScore, 0);
    const totalPassedCount = Object.values(bestPerProblem).reduce((acc, curr) => acc + curr.maxPassed, 0);

    // Update Team metrics
    await prisma.team.update({
      where: { id: team.id },
      data: {
        codingScore: totalCodingScore,
        totalPassedCases: totalPassedCount,
        submissionCount: { increment: 1 },
        penaltyTime: BigInt(elapsedSeconds),
        endTime: BigInt(now),
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: judge.status,
      compileError: judge.compileError,
      passedCount: judge.passedCount,
      totalCount: totalCases,
      earnedScore,
      maxProblemScore: problem.points,
      totalTeamCodingScore: totalCodingScore,
      results: judge.results, // Hidden test case inputs/outputs will be masked
      executionTimeMs: judge.totalTimeMs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
