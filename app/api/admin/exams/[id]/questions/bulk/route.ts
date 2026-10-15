/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;
    const body = await req.json();

    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, message: "Questions array cannot be empty" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const validQuestions: any[] = [];
    const errors: string[] = [];

    questions.forEach((raw: any, index: number) => {
      const qNum = index + 1;
      const questionText = raw.question || raw.Question || raw.QUESTION;

      if (!questionText || typeof questionText !== "string" || questionText.trim() === "") {
        errors.push(`Row ${qNum}: Missing question text`);
        return;
      }

      // Handle options: could be array or optionA, optionB, optionC, optionD
      let optionsList: string[] = [];
      if (Array.isArray(raw.options)) {
        optionsList = raw.options.map((o: any) => String(o).trim());
      } else {
        const optA = raw.optionA ?? raw.OptionA ?? raw["Option A"] ?? raw.A ?? raw.a;
        const optB = raw.optionB ?? raw.OptionB ?? raw["Option B"] ?? raw.B ?? raw.b;
        const optC = raw.optionC ?? raw.OptionC ?? raw["Option C"] ?? raw.C ?? raw.c;
        const optD = raw.optionD ?? raw.OptionD ?? raw["Option D"] ?? raw.D ?? raw.d;

        if (optA !== undefined && optB !== undefined) {
          optionsList = [String(optA).trim(), String(optB).trim()];
          if (optC !== undefined) optionsList.push(String(optC).trim());
          if (optD !== undefined) optionsList.push(String(optD).trim());
        }
      }

      if (optionsList.length < 2) {
        errors.push(`Row ${qNum}: At least 2 options are required`);
        return;
      }

      let rawAnswer = raw.answer ?? raw.Answer ?? raw.ANSWER ?? raw.correctAnswer;
      if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === "") {
        errors.push(`Row ${qNum}: Missing correct answer`);
        return;
      }

      rawAnswer = String(rawAnswer).trim();

      // If answer is "A", "B", "C", "D" (or "1", "2", "3", "4"), map to option text if needed
      let finalAnswer = rawAnswer;
      const lower = rawAnswer.toLowerCase();
      if (lower === "a" || lower === "1") finalAnswer = optionsList[0];
      else if (lower === "b" || lower === "2") finalAnswer = optionsList[1];
      else if (lower === "c" || lower === "3") finalAnswer = optionsList[2] ?? rawAnswer;
      else if (lower === "d" || lower === "4") finalAnswer = optionsList[3] ?? rawAnswer;

      const category = (raw.category || raw.Category || "General").toString().trim();
      const codeSnippet = raw.codeSnippet || raw.code || raw.Code || null;
      const points = Number(raw.points || raw.Marks || 1) || 1;

      validQuestions.push({
        question: questionText.trim(),
        options: optionsList,
        answer: finalAnswer,
        category,
        codeSnippet: codeSnippet ? String(codeSnippet).trim() : null,
        points,
        examId,
      });
    });

    if (validQuestions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid questions found to upload",
        errors,
      }, { status: 400 });
    }

    // Insert all valid questions
    await prisma.question.createMany({
      data: validQuestions,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${validQuestions.length} questions!`,
      count: validQuestions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
