import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function QuestionBox({ q, index, answer, setAnswer }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border rounded-xl shadow-sm p-6">
      <p className="font-semibold text-lg mb-4">
        {index + 1}. {q.question}
      </p>

      <RadioGroup
        value={answer || ""}
        onValueChange={(val) => setAnswer(index, val)}
        className="space-y-3"
      >
        {q.options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            <RadioGroupItem value={opt} id={`${index}-${i}`} />
            <Label htmlFor={`${index}-${i}`} className="cursor-pointer w-full">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
