import { prisma } from "@/lib/prisma";
import questions from "../data/ques.json";

async function main() {
  console.log("Cleaning up existing questions...");
  await prisma.question.deleteMany({});

  console.log(`Seeding ${questions.length} questions...`);
  // Using createMany for better performance in MongoDB (Prisma supports it)
  await prisma.question.createMany({
    data: questions,
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
