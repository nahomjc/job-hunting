"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { countActiveFilters } from "@/lib/jobs/parse-filters";
import type { CompanySize, ExperienceLevel, JobMatchFilters, RemoteFilter } from "@/types";
import {
  COMPANY_SIZE_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/jobs/job-metadata";

const REMOTE_OPTIONS: { value: RemoteFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const COMPANY_SIZES: CompanySize[] = ["startup", "mid", "enterprise"];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ["junior", "mid", "senior", "staff", "lead"];

function readFiltersFromParams(searchParams: URLSearchParams): JobMatchFilters & { q?: string } {
  const remoteParam = searchParams.get("remote");
  let remoteFilter: RemoteFilter = "all";
  if (remoteParam === "true" || remoteParam === "remote") remoteFilter = "remote";
  else if (remoteParam === "onsite") remoteFilter = "onsite";
  else if (remoteParam === "hybrid") remoteFilter = "hybrid";

  return {
    q: searchParams.get("q") ?? undefined,
    minScore: searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined,
    minSalary: searchParams.get("minSalary") ? Number(searchParams.get("minSalary")) : undefined,
    maxSalary: searchParams.get("maxSalary") ? Number(searchParams.get("maxSalary")) : undefined,
    location: searchParams.get("location") ?? undefined,
    remoteFilter,
    companySize: (searchParams.get("companySize") as CompanySize) || undefined,
    experienceLevel: (searchParams.get("experienceLevel") as ExperienceLevel) || undefined,
  };
}

export function JobsAdvancedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => readFiltersFromParams(searchParams));

  const activeFilters = countActiveFilters(readFiltersFromParams(searchParams));

  function openDialog() {
    setDraft(readFiltersFromParams(searchParams));
    setOpen(true);
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== "" && value !== 0) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    };

    setOrDelete("minScore", draft.minScore);
    setOrDelete("minSalary", draft.minSalary);
    setOrDelete("maxSalary", draft.maxSalary);
    setOrDelete("location", draft.location);

    if (draft.remoteFilter && draft.remoteFilter !== "all") {
      params.set("remote", draft.remoteFilter);
    } else {
      params.delete("remote");
    }

    if (draft.companySize) params.set("companySize", draft.companySize);
    else params.delete("companySize");

    if (draft.experienceLevel) params.set("experienceLevel", draft.experienceLevel);
    else params.delete("experienceLevel");

    router.push(`/dashboard/jobs?${params.toString()}`);
    setOpen(false);
  }

  function clearAll() {
    const q = searchParams.get("q");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/dashboard/jobs?${params.toString()}`);
    setDraft({ q: q ?? undefined, remoteFilter: "all" });
    setOpen(false);
  }

  function quickRemote(filter: RemoteFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") params.delete("remote");
    else params.set("remote", filter);
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

  const currentRemote = readFiltersFromParams(searchParams).remoteFilter ?? "all";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {REMOTE_OPTIONS.filter((o) => o.value !== "all").map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={currentRemote === value ? "default" : "outline"}
            className={cn(
              "h-8 rounded-full px-3 text-xs",
              currentRemote === value && "shadow-[var(--shadow-glow)]"
            )}
            onClick={() => quickRemote(currentRemote === value ? "all" : value)}
          >
            {label}
          </Button>
        ))}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full"
          onClick={openDialog}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && (
            <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
              {activeFilters}
            </Badge>
          )}
        </Button>

        {activeFilters > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced filters</DialogTitle>
            <DialogDescription>
              Narrow down jobs by salary, location, company size, and experience level.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minScore">Min match score</Label>
                <Input
                  id="minScore"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="70"
                  value={draft.minScore ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      minScore: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Remote status</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm"
                  value={draft.remoteFilter ?? "all"}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      remoteFilter: e.target.value as RemoteFilter,
                    }))
                  }
                >
                  {REMOTE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minSalary">Min salary (USD)</Label>
                <Input
                  id="minSalary"
                  type="number"
                  placeholder="80000"
                  value={draft.minSalary ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      minSalary: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary">Max salary (USD)</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  placeholder="200000"
                  value={draft.maxSalary ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      maxSalary: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="San Francisco, Europe, Remote…"
                value={draft.location ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, location: e.target.value || undefined }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company size</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm"
                  value={draft.companySize ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      companySize: (e.target.value as CompanySize) || undefined,
                    }))
                  }
                >
                  <option value="">Any size</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {COMPANY_SIZE_LABELS[size]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Experience level</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm"
                  value={draft.experienceLevel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      experienceLevel: (e.target.value as ExperienceLevel) || undefined,
                    }))
                  }
                >
                  <option value="">Any level</option>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {EXPERIENCE_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={clearAll}>
              Reset
            </Button>
            <Button type="button" variant="premium" onClick={applyFilters}>
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
