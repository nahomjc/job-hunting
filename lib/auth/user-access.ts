import type { UserRole } from "@/lib/db/schema";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}

export function isAdminUser(user: {
  role?: string | null;
  email?: string | null;
}): boolean {
  if (user.role === "admin") return true;
  return isAdminEmail(user.email);
}

export function isUserRole(value: string): value is UserRole {
  return value === "user" || value === "admin";
}
