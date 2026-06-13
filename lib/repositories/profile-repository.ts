import { eq } from "drizzle-orm";
import { requireDb, profiles } from "@/lib/db";
import type { ProfileFormData } from "@/types";

function buildPreferences(
  data: Partial<ProfileFormData>,
  existing?: Record<string, unknown> | null
) {
  const prefs = { ...(existing ?? {}) };
  if (data.huntCountry !== undefined) prefs.huntCountry = data.huntCountry;
  if (data.huntMode !== undefined) prefs.huntMode = data.huntMode;
  if (data.servicesOffered !== undefined) prefs.servicesOffered = data.servicesOffered;
  return prefs;
}

function stripPreferenceFields(data: Partial<ProfileFormData>) {
  const { huntCountry, huntMode, servicesOffered, ...rest } = data;
  return rest;
}

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
    const coreData = stripPreferenceFields(data);
    const preferences = buildPreferences(data, existing?.preferences);

    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...coreData, preferences, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(profiles)
      .values({ userId, ...coreData, preferences })
      .returning();
    return created;
  },

  async patchPreferences(userId: string, patch: Record<string, unknown>) {
    const db = requireDb();
    const existing = await this.getByUserId(userId);
    const preferences = { ...(existing?.preferences ?? {}), ...patch };

    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ preferences, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(profiles)
      .values({ userId, preferences })
      .returning();
    return created;
  },
};
