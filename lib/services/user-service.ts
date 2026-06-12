import { requireDb, users, subscriptions } from "@/lib/db";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { PLAN_MRR_CENTS } from "@/lib/admin/constants";
import { eq } from "drizzle-orm";

export const userService = {
  async syncFromAuth(authUser: { id: string; email?: string }) {
    const db = requireDb();

    await db
      .insert(users)
      .values({
        id: authUser.id,
        email: authUser.email ?? "",
        lastActiveAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: authUser.email ?? "",
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      });

    await db
      .insert(subscriptions)
      .values({
        userId: authUser.id,
        plan: "free",
        status: "active",
        mrrCents: PLAN_MRR_CENTS.free,
      })
      .onConflictDoNothing();

    const profile = await profileRepository.getByUserId(authUser.id);
    if (!profile) {
      await profileRepository.upsert(authUser.id, {});
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    return user;
  },
};
