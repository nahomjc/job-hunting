const MIN_VALID_MS = new Date("2000-01-01T00:00:00Z").getTime();
const MAX_VALID_MS = Date.now() + 366 * 24 * 60 * 60 * 1000;

function isValidJobDate(d: Date): boolean {
  const t = d.getTime();
  return !Number.isNaN(t) && t >= MIN_VALID_MS && t <= MAX_VALID_MS;
}

function fromUnixMs(ms: number): Date | undefined {
  const d = new Date(ms);
  return isValidJobDate(d) ? d : undefined;
}

function fromNumericTimestamp(n: number): Date | undefined {
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // Values below 1e12 are almost always Unix seconds (not ms).
  if (n < 1e12) return fromUnixMs(n * 1000);
  return fromUnixMs(n);
}

/** Parse job board posted dates — handles ISO strings and Unix seconds/ms. */
export function parseJobPostedDate(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;

  if (value instanceof Date) {
    return isValidJobDate(value) ? value : undefined;
  }

  if (typeof value === "number") {
    return fromNumericTimestamp(value);
  }

  const str = String(value).trim();
  if (!str) return undefined;

  if (/^\d+$/.test(str)) {
    return fromNumericTimestamp(Number(str));
  }

  const iso = new Date(str);
  if (isValidJobDate(iso)) return iso;

  const asNum = Number(str);
  if (!Number.isNaN(asNum)) return fromNumericTimestamp(asNum);

  return undefined;
}

/** Best date to show for a job row — skips bogus epoch-era postedAt values. */
export function resolveJobDisplayDate(
  postedAt: Date | string | null | undefined,
  fallback: Date | string | null | undefined
): Date | undefined {
  return parseJobPostedDate(postedAt) ?? parseJobPostedDate(fallback);
}
