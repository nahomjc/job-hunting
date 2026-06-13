export interface YouTubeVideoSuggestion {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
  searchQuery: string;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

const MAX_PER_QUERY = 3;
const MAX_TOTAL = 8;

export async function searchYouTubeVideos(
  queries: string[],
  options: { maxPerQuery?: number; maxTotal?: number } = {}
): Promise<YouTubeVideoSuggestion[]> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return [];

  const maxPerQuery = options.maxPerQuery ?? MAX_PER_QUERY;
  const maxTotal = options.maxTotal ?? MAX_TOTAL;
  const seen = new Set<string>();
  const results: YouTubeVideoSuggestion[] = [];

  for (const query of queries) {
    if (results.length >= maxTotal) break;

    const items = await fetchSearchResults(query, apiKey, maxPerQuery);
    for (const item of items) {
      if (!item.videoId || seen.has(item.videoId)) continue;
      seen.add(item.videoId);
      results.push(item);
      if (results.length >= maxTotal) break;
    }
  }

  return results;
}

async function fetchSearchResults(
  query: string,
  apiKey: string,
  maxResults: number
): Promise<YouTubeVideoSuggestion[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    safeSearch: "strict",
    relevanceLanguage: "en",
    key: apiKey,
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = (await res.json()) as YouTubeSearchResponse;
    const items = data.items ?? [];

    return items
      .map((item) => {
        const videoId = item.id?.videoId;
        if (!videoId) return null;

        const thumb =
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.default?.url ??
          "";

        return {
          videoId,
          title: item.snippet?.title ?? "YouTube video",
          channelTitle: item.snippet?.channelTitle ?? "",
          thumbnailUrl: thumb,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          searchQuery: query,
        };
      })
      .filter((v): v is YouTubeVideoSuggestion => v !== null);
  } catch {
    return [];
  }
}
