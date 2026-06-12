import type { Job } from "@/lib/db/schema";

export type ExperienceLevel = "junior" | "mid" | "senior" | "staff" | "lead" | "unknown";
export type CompanySize = "startup" | "mid" | "enterprise" | "unknown";

const ENTERPRISE_COMPANIES =
  /stripe|google|meta|amazon|microsoft|apple|netflix|uber|airbnb|salesforce|oracle|ibm|adobe|spotify|twitter|linkedin|nvidia|intel|paypal|shopify|atlassian|datadog|cloudflare|vercel|github|gitlab|slack|zoom|dropbox|twilio|square|block|coinbase|robinhood|doordash|instacart|lyft|snap|pinterest|reddit|discord|notion|figma|linear|openai|anthropic/i;

export function inferExperienceLevel(job: Pick<Job, "title" | "tags" | "description">): ExperienceLevel {
  const text = `${job.title} ${(job.tags ?? []).join(" ")} ${job.description ?? ""}`.toLowerCase();

  if (/\b(staff|principal|distinguished|fellow)\b/.test(text)) return "staff";
  if (/\b(lead|head of|director of)\b/.test(text)) return "lead";
  if (/\b(senior|sr\.?)\b/.test(text)) return "senior";
  if (/\b(junior|jr\.?|entry[- ]level|graduate|intern|internship)\b/.test(text)) return "junior";
  if (/\b(mid[- ]level|intermediate|ii\b|level 2)\b/.test(text)) return "mid";
  return "unknown";
}

export function inferCompanySize(job: Pick<Job, "company" | "tags">): CompanySize {
  const tags = (job.tags ?? []).join(" ").toLowerCase();
  const company = job.company.toLowerCase();

  if (ENTERPRISE_COMPANIES.test(company)) return "enterprise";
  if (/\b(startup|early[- ]stage|seed|series a|y combinator|yc)\b/.test(tags)) return "startup";
  if (/\b(scale[- ]up|series [b-d]|growth stage)\b/.test(tags)) return "mid";
  return "unknown";
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff+",
  lead: "Lead",
  unknown: "Not specified",
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  startup: "Startup",
  mid: "Mid-size",
  enterprise: "Enterprise",
  unknown: "Unknown",
};
