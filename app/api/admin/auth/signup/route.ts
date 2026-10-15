/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, role } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Full Name, Username, and Password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    const existing = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "An admin or organizer with this username already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EVENT_ORGANIZER";

    const newAdmin = await prisma.admin.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: name.trim(),
        role: assignedRole,
        createdAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // 🔐 Create JWT session for immediate login
    const token = jwt.sign(
      { id: newAdmin.id, username: newAdmin.username, name: newAdmin.name, role: newAdmin.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json({
      success: true,
      message: "Account registered successfully!",
      user: newAdmin,
    });

    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
