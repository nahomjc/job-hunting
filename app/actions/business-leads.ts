"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { businessLeadRepository } from "@/lib/repositories/business-lead-repository";
import { getHuntPreferences, getCountryLabel } from "@/lib/jobs/hunt-preferences";
import {
  discoverLocalBusinessLeads,
  DEFAULT_TARGET_LEADS,
  type LocalBusinessLead,
} from "@/lib/services/local-business-discovery";
import type { WebsiteStatus } from "@/lib/services/company-web-probe";
import { rateLimit } from "@/lib/security/rate-limit";
import type { Job } from "@/lib/db/schema";

export interface BusinessLeadResult {
  jobId: string;
  company: string;
  title: string;
  location: string | null;
  category: string;
  websiteStatus: WebsiteStatus;
  jobUrl: string;
  source: "osm";
  analysisNote: string;
  countryLabel: string;
}

function toBusinessLeadResult(
  lead: {
    category: string;
    websiteStatus: WebsiteStatus;
    source: string;
    analysisNote: string | null;
  },
  job: Pick<Job, "id" | "company" | "title" | "location" | "url" | "description">,
  countryLabel: string
): BusinessLeadResult {
  return {
    jobId: job.id,
    company: job.company,
    title: job.title,
    location: job.location,
    category: lead.category,
    websiteStatus: lead.websiteStatus,
    jobUrl: job.url,
    source: lead.source as "osm",
    analysisNote: lead.analysisNote ?? job.description ?? "",
    countryLabel,
  };
}

async function persistLeadJob(lead: LocalBusinessLead, countryLabel: string) {
  const job = await jobRepository.upsert({
    externalId: lead.id,
    provider: "manual",
    company: lead.name,
    title: `${lead.category} — local business lead`,
    description: [
      lead.analysisNote,
      lead.address ? `Address: ${lead.address}` : null,
      `Discovered via OpenStreetMap in ${countryLabel}.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    url: lead.listingUrl,
    location: lead.location,
    isRemote: false,
    tags: ["local-lead", lead.category, lead.source],
    rawData: lead.rawData,
  });

  return job;
}

export async function getLocalBusinessLeads(
  countryCode?: string
): Promise<BusinessLeadResult[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const profile = await profileRepository.getByUserId(user.id);
  const huntPrefs = getHuntPreferences(profile?.preferences);
  const code = countryCode ?? huntPrefs.huntCountry;
  if (!code) return [];

  const rows = await businessLeadRepository.findForUser(user.id, code);
  const countryLabel = getCountryLabel(code);

  return rows.map(({ lead, job }) => toBusinessLeadResult(lead, job, countryLabel));
}

export async function scanLocalBusinessLeads(): Promise<BusinessLeadResult[]> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`business-leads:${user.id}`, 5, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded — try again in a minute");

  const profile = await profileRepository.getByUserId(user.id);
  const huntPrefs = getHuntPreferences(profile?.preferences);
  const countryCode = huntPrefs.huntCountry;

  if (!countryCode) {
    throw new Error(
      "Set your hunt country in Local Hunt or Settings → Local hunt before scanning for business leads."
    );
  }

  const countryLabel = getCountryLabel(countryCode);
  const discoveries = await discoverLocalBusinessLeads(countryCode, {
    targetLeads: DEFAULT_TARGET_LEADS,
  });

  for (const lead of discoveries) {
    const job = await persistLeadJob(lead, countryLabel);
    await businessLeadRepository.upsert({
      userId: user.id,
      jobId: job.id,
      countryCode,
      category: lead.category,
      websiteStatus: lead.websiteStatus,
      source: lead.source,
      analysisNote: lead.analysisNote,
    });
  }

  revalidatePath("/dashboard/hunt");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/leads");

  return getLocalBusinessLeads(countryCode);
}

/** @deprecated Use scanLocalBusinessLeads — kept for compatibility */
export type NoWebsiteLead = BusinessLeadResult;

export async function scanNoWebsiteLeads(): Promise<BusinessLeadResult[]> {
  return scanLocalBusinessLeads();
}
