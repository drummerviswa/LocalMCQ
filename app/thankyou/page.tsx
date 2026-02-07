import { CircleCheckBig } from "lucide-react";

export default function ThankyouPage() {
  return (
    <div className="bg-linear-to-b from-white to-zinc-100 h-screen flex flex-col items-center justify-center">
      <CircleCheckBig className="mx-auto text-gray-950" size={80} />
      <h1 className="text-4xl font-bold text-center mt-10 text-gray-950">
        Thank you for participating! 🙌🏻
      </h1>
      <p className="text-center mt-4 text-lg text-zinc-500">
        We appreciate your time and effort. Stay tuned for the results!
      </p>
    </div>
  );
}
