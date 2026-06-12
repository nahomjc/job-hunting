"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 items-end rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="minScore" className="text-xs">Min Score</Label>
        <Input
          id="minScore"
          type="number"
          min={0}
          max={100}
          placeholder="70"
          className="w-24"
          defaultValue={searchParams.get("minScore") ?? ""}
          onChange={(e) => updateFilter("minScore", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="minSalary" className="text-xs">Min Salary</Label>
        <Input
          id="minSalary"
          type="number"
          placeholder="100000"
          className="w-32"
          defaultValue={searchParams.get("minSalary") ?? ""}
          onChange={(e) => updateFilter("minSalary", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="location" className="text-xs">Location</Label>
        <Input
          id="location"
          placeholder="San Francisco"
          className="w-40"
          defaultValue={searchParams.get("location") ?? ""}
          onChange={(e) => updateFilter("location", e.target.value)}
        />
      </div>
      <Button
        variant={searchParams.get("remote") === "true" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          updateFilter("remote", searchParams.get("remote") === "true" ? "" : "true")
        }
      >
        Remote only
      </Button>
    </div>
  );
}
