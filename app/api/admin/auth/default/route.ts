import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(request: NextRequest, response: NextResponse) {
  const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin";

  if (!adminUsername || !adminPassword) {
    return NextResponse.json(
      { message: "Missing admin credentials in env" },
      { status: 500 },
    );
  }

  const existingAdmin = await prisma.admin?.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return NextResponse.json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.admin?.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      name: "Admin",
    },
  });

  return NextResponse.json({ message: "Admin created" });
}
