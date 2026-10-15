/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin, isSuperAdmin } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            exams: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, admins });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { username, password, name, role } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Username, password, and name are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findUnique({
      where: { username: username.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Admin with this username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EVENT_ORGANIZER",
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { adminId, name, username, role, password } = await req.json();

    if (!adminId) {
      return NextResponse.json({ success: false, message: "Admin ID is required" }, { status: 400 });
    }

    // Only Super Admin can edit other admins or assign roles
    if (!isSuperAdmin(session) && session.id !== adminId) {
      return NextResponse.json(
        { success: false, message: "Only Super Admin can edit this account" },
        { status: 403 }
      );
    }

    const existing = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }

    // If username changed, check uniqueness
    if (username && username.trim() !== existing.username) {
      const conflict = await prisma.admin.findUnique({
        where: { username: username.trim() },
      });
      if (conflict && conflict.id !== adminId) {
        return NextResponse.json(
          { success: false, message: "Username already taken by another account" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (username) updateData.username = username.trim();
    if (role && isSuperAdmin(session)) {
      updateData.role = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EVENT_ORGANIZER";
    }
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json({ success: false, message: "Admin ID required" }, { status: 400 });
    }

    if (adminId === session.id) {
      return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.admin.delete({
      where: { id: adminId },
    });

    return NextResponse.json({ success: true, message: "Admin removed successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
