"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { userRepository } from "@/lib/repositories/user-repository";
import { isUserRole } from "@/lib/auth/user-access";
import { logAudit } from "@/lib/security/audit";
import type { UserRole } from "@/lib/db/schema";

export async function updateUserRole(userId: string, role: UserRole) {
  const { auth } = await requireAdmin();
  if (!isUserRole(role)) throw new Error("Invalid role");

  if (userId === auth.id && role !== "admin") {
    throw new Error("You cannot remove your own admin role");
  }

  const updated = await userRepository.updateRole(userId, role);
  if (!updated) throw new Error("User not found");

  await logAudit({
    userId: auth.id,
    action: "admin.user.role_update",
    resource: "users",
    resourceId: userId,
    metadata: { role },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, role: updated.role };
}

export async function setUserBlocked(userId: string, blocked: boolean, reason?: string) {
  const { auth } = await requireAdmin();

  if (userId === auth.id && blocked) {
    throw new Error("You cannot block your own account");
  }

  const updated = await userRepository.setBlocked(userId, blocked, reason);
  if (!updated) throw new Error("User not found");

  await logAudit({
    userId: auth.id,
    action: blocked ? "admin.user.block" : "admin.user.unblock",
    resource: "users",
    resourceId: userId,
    metadata: { reason: reason ?? null },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, blocked: updated.blocked };
}
