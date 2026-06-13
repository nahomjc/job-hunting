import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery, stripHtml } from "./utils";
import { externalIdFromUrl, parseRssItems } from "./rss-utils";

const FEEDS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
];

function parseTitle(title: string): { company: string; jobTitle: string } {
  const colonIdx = title.indexOf(":");
  if (colonIdx === -1) {
    return { company: "Unknown", jobTitle: title };
  }

  return {
    company: title.slice(0, colonIdx).trim(),
    jobTitle: title.slice(colonIdx + 1).trim(),
  };
}

export class WeWorkRemotelyProvider implements JobProviderAdapter {
  readonly name = "weworkremotely" as const;
  readonly displayName = "We Work Remotely";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const seen = new Set<string>();
    const results: JobSearchResult[] = [];

    const responses = await Promise.all(
      FEEDS.map((feed) =>
        fetch(feed, {
          headers: { "User-Agent": "JobHunter-AI/1.0" },
          cache: "no-store",
        }).catch(() => null)
      )
    );

    for (const res of responses) {
      if (!res?.ok) continue;

      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (!item.link || !item.title) continue;

        const id = externalIdFromUrl(item.guid || item.link);
        if (seen.has(id)) continue;

        const { company, jobTitle } = parseTitle(item.title);
        const description = stripHtml(item.description);

        if (
          !matchesQuery(
            [jobTitle, company, description, item.category, item.region],
            query
          )
        ) {
          continue;
        }

        seen.add(id);
        results.push({
          externalId: id,
          provider: "weworkremotely" as const,
          company,
          title: jobTitle,
          description,
          url: item.link,
          location: item.region || undefined,
          isRemote: true,
          tags: item.category ? [item.category] : [],
          postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          rawData: item as unknown as Record<string, unknown>,
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }

    return results;
  }
}
