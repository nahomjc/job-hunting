"use server";

import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { probeCompanyWebsite, type WebsiteStatus } from "@/lib/services/company-web-probe";
import { rateLimit } from "@/lib/security/rate-limit";

export interface NoWebsiteLead {
  jobId: string;
  company: string;
  title: string;
  location: string | null;
  websiteStatus: WebsiteStatus;
  jobUrl: string;
}

const MAX_PROBE = 15;

export async function scanNoWebsiteLeads(): Promise<NoWebsiteLead[]> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`business-leads:${user.id}`, 5, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded — try again in a minute");

  const matches = await jobMatchRepository.findForUser(user.id, { sortBy: "date" });
  const seenCompanies = new Set<string>();
  const leads: NoWebsiteLead[] = [];

  for (const { job } of matches) {
    const key = job.company.trim().toLowerCase();
    if (!key || seenCompanies.has(key)) continue;
    seenCompanies.add(key);

    if (seenCompanies.size > MAX_PROBE + leads.length) break;

    const probe = await probeCompanyWebsite(job.company, job.url);
    if (probe.status === "found") continue;

    leads.push({
      jobId: job.id,
      company: job.company,
      title: job.title,
      location: job.location,
      websiteStatus: probe.status,
      jobUrl: job.url,
    });

    if (leads.length >= MAX_PROBE) break;
  }

  return leads;
}
