import { NextResponse } from "next/server";

function clearSessionResponse() {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

export async function POST() {
  return clearSessionResponse();
}

export async function GET() {
  return clearSessionResponse();
}
