import questions from "@/data/ques.json";

export function getRandomQuestions() {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const pool50 = shuffled.slice(0, 50);
  return pool50.sort(() => 0.5 - Math.random()).slice(0, 20);
}

export function evaluateAnswers(questions: any[], answers: Record<number, string>) {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });
  return score;
}
