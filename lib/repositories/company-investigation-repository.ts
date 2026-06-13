import { eq, and, desc } from "drizzle-orm";
import { requireDb, companyInvestigations, jobs } from "@/lib/db";

export interface CompanyGap {
  type: string;
  severity: "low" | "medium" | "high";
  evidence: string;
}

export interface InvestigationInput {
  userId: string;
  jobId: string;
  company: string;
  country?: string;
  websiteUrl?: string;
  websiteStatus: "found" | "missing" | "unreachable";
  gaps: CompanyGap[];
  intelSummary: string;
  pitchLetter?: string;
  pitchService?: string;
}

export const companyInvestigationRepository = {
  async upsert(data: InvestigationInput) {
    const db = requireDb();
    const [row] = await db
      .insert(companyInvestigations)
      .values({
        userId: data.userId,
        jobId: data.jobId,
        company: data.company,
        country: data.country,
        websiteUrl: data.websiteUrl,
        websiteStatus: data.websiteStatus,
        gaps: data.gaps,
        intelSummary: data.intelSummary,
        pitchLetter: data.pitchLetter,
        pitchService: data.pitchService,
      })
      .onConflictDoUpdate({
        target: [companyInvestigations.userId, companyInvestigations.jobId],
        set: {
          company: data.company,
          country: data.country,
          websiteUrl: data.websiteUrl,
          websiteStatus: data.websiteStatus,
          gaps: data.gaps,
          intelSummary: data.intelSummary,
          pitchLetter: data.pitchLetter ?? null,
          pitchService: data.pitchService ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  },

  async findByUserAndJob(userId: string, jobId: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(companyInvestigations)
      .where(
        and(
          eq(companyInvestigations.userId, userId),
          eq(companyInvestigations.jobId, jobId)
        )
      )
      .limit(1);
    return row ?? null;
  },

  async findForUser(userId: string) {
    const db = requireDb();
    return db
      .select({
        investigation: companyInvestigations,
        job: jobs,
      })
      .from(companyInvestigations)
      .innerJoin(jobs, eq(companyInvestigations.jobId, jobs.id))
      .where(eq(companyInvestigations.userId, userId))
      .orderBy(desc(companyInvestigations.updatedAt));
  },
};
