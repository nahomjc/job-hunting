"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, PlayCircle, TvMinimalPlay } from "lucide-react";
import { fetchInterviewPrepVideos } from "@/app/actions/interviews";
import { Button } from "@/components/ui/button";

interface InterviewPrepVideosProps {
  applicationId: string;
}

export function InterviewPrepVideos({ applicationId }: InterviewPrepVideosProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<
    Awaited<ReturnType<typeof fetchInterviewPrepVideos>>["videos"]
  >([]);
  const [searchLinks, setSearchLinks] = useState<
    Awaited<ReturnType<typeof fetchInterviewPrepVideos>>["searchLinks"]
  >([]);
  const [youtubeApiEnabled, setYoutubeApiEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchInterviewPrepVideos(applicationId);
        if (!cancelled) {
          setVideos(result.videos);
          setSearchLinks(result.searchLinks);
          setYoutubeApiEnabled(result.youtubeApiEnabled);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load video suggestions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding interview prep videos on YouTube…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <TvMinimalPlay className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Prepare with YouTube</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Videos tailored to this role and interview stage — general tips plus skills from the
            job description.
          </p>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.map((video) => (
            <a
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 rounded-lg border border-border/60 bg-background p-2.5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className="relative shrink-0 w-28 aspect-video rounded-md overflow-hidden bg-muted">
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-8 w-8 text-white drop-shadow" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary">
                  {video.title}
                </p>
                {video.channelTitle && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{video.channelTitle}</p>
                )}
                <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                  Matched: {video.searchQuery}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {videos.length === 0 && searchLinks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {youtubeApiEnabled
            ? "No videos matched this role right now — try the searches below."
            : "Add YOUTUBE_API_KEY to show embedded video picks, or use the searches below on YouTube."}
        </p>
      )}

      {searchLinks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {videos.length > 0 ? "More on YouTube" : "Search on YouTube"}
          </p>
          <div className="flex flex-wrap gap-2">
            {searchLinks.map((link) => (
              <Button key={link.url} variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
