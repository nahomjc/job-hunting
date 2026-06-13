import { eq } from "drizzle-orm";
import { requireDb, users } from "@/lib/db";
import type { UserRole } from "@/lib/db/schema";

export const userRepository = {
  async getById(id: string) {
    const db = requireDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  async updateRole(userId: string, role: UserRole) {
    const db = requireDb();
    const [row] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return row;
  },

  async setBlocked(userId: string, blocked: boolean, reason?: string) {
    const db = requireDb();
    const [row] = await db
      .update(users)
      .set({
        blocked,
        blockedAt: blocked ? new Date() : null,
        blockedReason: blocked ? reason ?? null : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return row;
  },
};
