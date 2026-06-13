import type { JobSearchResult } from "@/types";

export const ETHIOPIA_FETCH_HEADERS = {
  "User-Agent": "JobHunter-AI/1.0 (Ethiopia job discovery)",
  Accept: "text/html,application/json",
};

export async function fetchText(url: string, timeoutMs = 20000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: ETHIOPIA_FETCH_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string, body: unknown, timeoutMs = 20000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...ETHIOPIA_FETCH_HEADERS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function parseNextData<T>(html: string): T | null {
  const marker = 'id="__NEXT_DATA__"';
  const i = html.indexOf(marker);
  if (i === -1) return null;
  const start = html.indexOf(">", i) + 1;
  const end = html.indexOf("</script>", start);
  if (end === -1) return null;
  try {
    return JSON.parse(html.slice(start, end)) as T;
  } catch {
    return null;
  }
}

export function defaultEthiopiaLocation(city?: string | null): string {
  if (city?.trim()) return `${city.trim()}, Ethiopia`;
  return "Addis Ababa, Ethiopia";
}

export function mapEthiopiaJob(
  partial: Omit<JobSearchResult, "provider">,
  provider: JobSearchResult["provider"]
): JobSearchResult {
  return {
    ...partial,
    provider,
    location: partial.location ?? defaultEthiopiaLocation(),
    tags: [...(partial.tags ?? []), "ethiopia"],
    isRemote: partial.isRemote ?? false,
  };
}
