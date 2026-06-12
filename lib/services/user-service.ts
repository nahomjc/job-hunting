import { requireDb, users } from "@/lib/db";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { eq } from "drizzle-orm";

export const userService = {
  async syncFromAuth(authUser: { id: string; email?: string }) {
    const db = requireDb();

    await db
      .insert(users)
      .values({
        id: authUser.id,
        email: authUser.email ?? "",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: authUser.email ?? "", updatedAt: new Date() },
      });

    const profile = await profileRepository.getByUserId(authUser.id);
    if (!profile) {
      await profileRepository.upsert(authUser.id, {});
    }

    const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    return user;
  },
};
