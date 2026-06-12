import { eq } from "drizzle-orm";
import { requireDb, profiles } from "@/lib/db";
import type { ProfileFormData } from "@/types";

export const profileRepository = {
  async getByUserId(userId: string) {
    const db = requireDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return profile ?? null;
  },

  async upsert(userId: string, data: Partial<ProfileFormData>) {
    const db = requireDb();
    const existing = await this.getByUserId(userId);

    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(profiles)
      .values({ userId, ...data })
      .returning();
    return created;
  },
};
