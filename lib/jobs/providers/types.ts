import type { JobProvider, JobSearchResult } from "@/types";

export interface JobProviderAdapter {
  readonly name: JobProvider;
  readonly displayName: string;
  search(query: string, options?: SearchOptions): Promise<JobSearchResult[]>;
}

export interface SearchOptions {
  location?: string;
  remote?: boolean;
  limit?: number;
}
