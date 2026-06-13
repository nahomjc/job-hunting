import type { JobProvider, JobSearchResult } from "@/types";

export interface JobProviderAdapter {
  readonly name: JobProvider;
  readonly displayName: string;
  search(query: string, options?: SearchOptions): Promise<JobSearchResult[]>;
}

import type { HuntMode } from "@/lib/jobs/hunt-preferences";

export interface SearchOptions {
  location?: string;
  country?: string;
  huntMode?: HuntMode;
  remote?: boolean;
  limit?: number;
}
