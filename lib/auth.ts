import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type Role = "SUPER_ADMIN" | "EVENT_ORGANIZER" | "ADMIN";

export interface AdminPayload {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export async function getSessionAdmin(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function isSuperAdmin(admin: AdminPayload | null): boolean {
  return admin?.role === "SUPER_ADMIN";
}
