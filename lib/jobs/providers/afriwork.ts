import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { fetchText, parseNextData } from "./ethiopia-utils";

/**
 * Afriwork listings load client-side; their GraphQL API requires authentication.
 * This provider attempts SSR extraction and returns [] when no listings are embedded.
 */
interface AfriworkJobStub {
  id?: string;
  title?: string;
  slug?: string;
  company?: { name?: string };
  location?: string;
  description?: string;
  isRemote?: boolean;
}

export class AfriworkProvider implements JobProviderAdapter {
  readonly name = "afriwork" as const;
  readonly displayName = "Afriwork";

  async search(_query: string, _options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const html = await fetchText("https://afriworket.com/jobs");
    if (!html) return [];

    const stubs = this.extractJobStubs(html);
    if (stubs.length === 0) return [];

    const limit = _options.limit ?? 25;
    const query = _query.trim();

    return stubs
      .filter((job) => {
        if (!query) return true;
        const haystack = [job.title, job.company?.name, job.location, job.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
        return terms.length === 0 || terms.some((t) => haystack.includes(t));
      })
      .slice(0, limit)
      .map((job, index) => ({
        externalId: job.id ?? job.slug ?? `afriwork-${index}`,
        provider: "afriwork" as const,
        company: job.company?.name ?? "Unknown company",
        title: job.title ?? "Job opening",
        description: job.description ?? "",
        url: job.slug
          ? `https://afriworket.com/jobs/${job.slug}`
          : "https://afriworket.com/jobs",
        location: job.location ?? "Addis Ababa, Ethiopia",
        isRemote: job.isRemote ?? false,
        tags: ["ethiopia", "afriwork"],
        rawData: job as unknown as Record<string, unknown>,
      }));
  }

  private extractJobStubs(html: string): AfriworkJobStub[] {
    const data = parseNextData<unknown>(html);
    if (!data) return [];

    const found: AfriworkJobStub[] = [];
    const seen = new Set<string>();

    const walk = (value: unknown, depth = 0) => {
      if (depth > 12 || value == null) return;
      if (Array.isArray(value)) {
        value.forEach((item) => walk(item, depth + 1));
        return;
      }
      if (typeof value !== "object") return;

      const obj = value as Record<string, unknown>;
      const title = typeof obj.title === "string" ? obj.title : undefined;
      const id = typeof obj.id === "string" ? obj.id : undefined;
      const slug = typeof obj.slug === "string" ? obj.slug : undefined;

      if (title && (id || slug)) {
        const key = id ?? slug ?? title;
        if (!seen.has(key)) {
          seen.add(key);
          const company =
            typeof obj.company === "object" && obj.company && "name" in obj.company
              ? { name: String((obj.company as { name?: string }).name ?? "") }
              : typeof obj.companyName === "string"
                ? { name: obj.companyName }
                : undefined;

          found.push({
            id,
            slug,
            title,
            company,
            location: typeof obj.location === "string" ? obj.location : undefined,
            description:
              typeof obj.description === "string"
                ? obj.description
                : typeof obj.summary === "string"
                  ? obj.summary
                  : undefined,
            isRemote: Boolean(obj.isRemote ?? obj.is_online),
          });
        }
      }

      Object.values(obj).forEach((child) => walk(child, depth + 1));
    };

    walk(data);
    return found;
  }
}
