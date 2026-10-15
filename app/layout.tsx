import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./StoreProvider";

export const metadata: Metadata = {
  title: "LocalMCQ - Multi-Exam Assessment Platform",
  description: "High-performance MCQ and Coding assessment suite for Symposiums and Contests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
