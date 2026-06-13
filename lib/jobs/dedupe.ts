const LEGAL_SUFFIXES =
  /\b(limited|ltd|llc|inc|incorporated|corp|corporation|plc|gmbh|ag|sa|bv|nv|co|uk|usa|us)\b/gi;

const COMPANY_NOISE =
  /\b(interactive|technologies|technology|tech|group|holdings|solutions|services|consulting|international|global|worldwide|systems|software)\b/gi;

/** Collapse legal suffixes and filler words so "Photon Interactive UK Limited" → "photon". */
export function normalizeCompanyName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^\w\s&]/g, " ")
    .replace(LEGAL_SUFFIXES, "")
    .replace(COMPANY_NOISE, "")
    .replace(/\s+/g, " ")
    .trim();

  const token = cleaned.split(" ").filter(Boolean)[0];
  return token ?? cleaned;
}

/** Strip board-specific suffixes like "| Offshore" so titles match across sources. */
export function normalizeJobTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\|.*$/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\w\s+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeJobLocation(location?: string | null): string {
  if (!location) return "";

  return location
    .toLowerCase()
    .split(",")[0]
    ?.replace(/\b(remote|hybrid|onsite|not specified|anywhere|worldwide)\b/g, "")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

export function buildJobDedupeKey(input: {
  company: string;
  title: string;
  location?: string | null;
}): string {
  const company = normalizeCompanyName(input.company);
  const title = normalizeJobTitle(input.title);
  const location = normalizeJobLocation(input.location);

  if (location) {
    return `${company}:${title}:${location}`;
  }
  return `${company}:${title}`;
}

export function dedupeKeyFromJob(job: {
  dedupeKey?: string | null;
  company: string;
  title: string;
  location?: string | null;
}): string {
  return (
    job.dedupeKey ??
    buildJobDedupeKey({
      company: job.company,
      title: job.title,
      location: job.location,
    })
  );
}
