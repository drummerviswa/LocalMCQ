import { prisma } from "../lib/prisma";
import questions from "../data/ques.json";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding database for LocalMCQ...");

  // 1. Create default Super Admin if not exists
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";

  let admin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: "Super Admin",
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Created default Super Admin: ${adminUsername}`);
  }

  // 2. Create default exam if not exists
  let exam = await prisma.exam.findUnique({
    where: { slug: "code-matrix" },
  });

  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        title: "Code Matrix — Round 1",
        slug: "code-matrix",
        description: "Official Round 1 Assessment covering Programming, DBMS, OS, Data Structures, and Output Analysis.",
        rules: "The quiz duration is 15 minutes.\nTotal 20 MCQ questions will be presented dynamically.\nFullscreen mode is enforced throughout.\nTab switching triggers proctor strikes (3 strikes = disqualified).\nAnswers are auto-saved in real time.",
        durationMinutes: 15,
        totalQuestionsToAsk: 20,
        minTeamSize: 1,
        maxTeamSize: 2,
        status: "LIVE",
        adminId: admin.id,
      },
    });
    console.log(`Created default Exam: Code Matrix (slug: code-matrix)`);
  }

  // 3. Seed questions for this exam
  const count = await prisma.question.count({
    where: { examId: exam.id },
  });

  if (count === 0 && questions.length > 0) {
    console.log(`Importing ${questions.length} questions for Code Matrix...`);
    const formatted = questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      category: q.category || "General",
      points: 1,
      examId: exam.id,
    }));

    await prisma.question.createMany({
      data: formatted,
    });
    console.log(`Successfully seeded ${formatted.length} questions!`);
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
