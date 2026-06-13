import { eq, and, desc } from "drizzle-orm";
import { requireDb, userBusinessLeads, jobs } from "@/lib/db";
import type { WebsiteStatus } from "@/lib/services/company-web-probe";

export interface BusinessLeadInput {
  userId: string;
  jobId: string;
  countryCode: string;
  category: string;
  websiteStatus: WebsiteStatus;
  source?: string;
  analysisNote?: string;
}

export const businessLeadRepository = {
  async upsert(data: BusinessLeadInput) {
    const db = requireDb();
    const [row] = await db
      .insert(userBusinessLeads)
      .values({
        userId: data.userId,
        jobId: data.jobId,
        countryCode: data.countryCode,
        category: data.category,
        websiteStatus: data.websiteStatus,
        source: data.source ?? "osm",
        analysisNote: data.analysisNote,
      })
      .onConflictDoUpdate({
        target: [userBusinessLeads.userId, userBusinessLeads.jobId],
        set: {
          countryCode: data.countryCode,
          category: data.category,
          websiteStatus: data.websiteStatus,
          analysisNote: data.analysisNote,
        },
      })
      .returning();
    return row;
  },

  async findForUser(userId: string, countryCode?: string) {
    const db = requireDb();
    const conditions = [eq(userBusinessLeads.userId, userId)];
    if (countryCode) {
      conditions.push(eq(userBusinessLeads.countryCode, countryCode));
    }

    return db
      .select({
        lead: userBusinessLeads,
        job: jobs,
      })
      .from(userBusinessLeads)
      .innerJoin(jobs, eq(userBusinessLeads.jobId, jobs.id))
      .where(and(...conditions))
      .orderBy(desc(userBusinessLeads.createdAt));
  },
};
