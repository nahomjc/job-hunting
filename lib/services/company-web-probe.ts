export type WebsiteStatus = "found" | "missing" | "unreachable";

function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(limited|ltd|llc|inc|uk|interactive|group|holdings|technologies|technology|tech)\b/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function guessDomains(company: string): string[] {
  const slug = slugifyCompany(company);
  if (!slug) return [];

  const candidates = [
    `https://${slug}.com`,
    `https://www.${slug}.com`,
    `https://${slug}.io`,
    `https://${slug}.co`,
  ];

  const firstWord = company.toLowerCase().split(/\s+/)[0]?.replace(/[^a-z0-9]/g, "");
  if (firstWord && firstWord !== slug) {
    candidates.push(`https://${firstWord}.com`, `https://www.${firstWord}.com`);
  }

  return [...new Set(candidates)];
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function probeCompanyWebsite(
  company: string,
  jobUrl?: string
): Promise<{ status: WebsiteStatus; url?: string }> {
  const jobHost = jobUrl ? hostFromUrl(jobUrl) : null;
  const skipHosts = new Set([
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
    "remoteok.com",
    "remotive.com",
    "jobicy.com",
    "landing.jobs",
    "weworkremotely.com",
  ]);

  const domains = guessDomains(company);
  if (jobHost && !skipHosts.has(jobHost) && !domains.some((d) => d.includes(jobHost))) {
    domains.unshift(`https://${jobHost}`);
  }

  let anyUnreachable = false;

  for (const url of domains.slice(0, 6)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "JobHunter-AI/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (res.ok || res.status === 405) {
        return { status: "found", url };
      }
      anyUnreachable = true;
    } catch {
      anyUnreachable = true;
    }
  }

  return { status: anyUnreachable ? "unreachable" : "missing" };
}

export function extractDescriptionSignals(description: string): string[] {
  const signals: string[] = [];
  const lower = description.toLowerCase();

  if (/no website|without a website|lack of online presence/.test(lower)) {
    signals.push("Job text suggests limited web presence");
  }
  if (/hiring.*marketing|marketing manager|growth lead/.test(lower)) {
    signals.push("Company is hiring for marketing roles");
  }
  if (/accountant|bookkeeping|finance manager/.test(lower)) {
    signals.push("Company may need accounting/finance support");
  }
  if (/social media|instagram|facebook|linkedin/.test(lower)) {
    signals.push("Social media mentioned in posting");
  }

  return signals;
}
