"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  readFiltersFromSearchParams,
  filtersToSearchParams,
} from "@/lib/jobs/parse-filters";
import { clearPageParam } from "@/lib/jobs/pagination";
import {
  getCountryLabel,
  getHuntModeLabel,
  type HuntMode,
} from "@/lib/jobs/hunt-preferences";
import {
  COMPANY_SIZE_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/jobs/job-metadata";
import type { JobMatchFilters, RemoteFilter } from "@/types";

interface JobsActiveFiltersProps {
  basePath: string;
  variant?: "jobs" | "hunt";
}

type Chip = { key: string; label: string; remove: () => Partial<JobMatchFilters> };

const REMOTE_LABELS: Record<RemoteFilter, string> = {
  all: "All",
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export function JobsActiveFilters({ basePath, variant = "jobs" }: JobsActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const includeHunt = variant === "hunt";
  const filters = readFiltersFromSearchParams(searchParams, { includeHunt });

  function navigate(next: Partial<JobMatchFilters> & { q?: string }) {
    const merged = { ...filters, ...next };
    const params = filtersToSearchParams(merged, { includeHunt });
    const q = merged.q ?? merged.search;
    if (q) params.set("q", q);
    else params.delete("q");
    clearPageParam(params);
    router.push(`${basePath}?${params.toString()}`);
  }

  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `Search: ${filters.q}`,
      remove: () => ({ q: undefined, search: undefined }),
    });
  }
  if (filters.minScore) {
    chips.push({
      key: "minScore",
      label: `Score ≥ ${filters.minScore}`,
      remove: () => ({ minScore: undefined }),
    });
  }
  if (filters.minSalary) {
    chips.push({
      key: "minSalary",
      label: `Min $${filters.minSalary.toLocaleString()}`,
      remove: () => ({ minSalary: undefined }),
    });
  }
  if (filters.maxSalary) {
    chips.push({
      key: "maxSalary",
      label: `Max $${filters.maxSalary.toLocaleString()}`,
      remove: () => ({ maxSalary: undefined }),
    });
  }
  if (filters.remoteFilter && filters.remoteFilter !== "all") {
    chips.push({
      key: "remote",
      label: REMOTE_LABELS[filters.remoteFilter],
      remove: () => ({ remoteFilter: "all", remote: undefined }),
    });
  }
  if (filters.location) {
    chips.push({
      key: "location",
      label: `Location: ${filters.location}`,
      remove: () => ({ location: undefined }),
    });
  }
  if (filters.companySize) {
    chips.push({
      key: "companySize",
      label: COMPANY_SIZE_LABELS[filters.companySize],
      remove: () => ({ companySize: undefined }),
    });
  }
  if (filters.experienceLevel) {
    chips.push({
      key: "experienceLevel",
      label: EXPERIENCE_LABELS[filters.experienceLevel],
      remove: () => ({ experienceLevel: undefined }),
    });
  }
  if (includeHunt && filters.huntCountry) {
    chips.push({
      key: "country",
      label: getCountryLabel(filters.huntCountry),
      remove: () => ({ huntCountry: undefined }),
    });
  }
  if (includeHunt && filters.huntMode && filters.huntMode !== "any") {
    chips.push({
      key: "huntMode",
      label: getHuntModeLabel(filters.huntMode as HuntMode),
      remove: () => ({ huntMode: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground">Active:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="gap-1 pl-2.5 pr-1 py-1 text-xs font-normal"
        >
          {chip.label}
          <button
            type="button"
            className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
            aria-label={`Remove ${chip.label}`}
            onClick={() => navigate(chip.remove())}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
