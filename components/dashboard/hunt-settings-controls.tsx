"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HuntCountrySelect, HuntModeSelect } from "@/components/dashboard/hunt-select-fields";
import { updateHuntPreferences } from "@/app/actions/profile";
import { clearPageParam } from "@/lib/jobs/pagination";
import type { HuntMode } from "@/lib/jobs/hunt-preferences";
import { toast } from "sonner";

interface HuntSettingsControlsProps {
  initialCountry: string;
  initialMode: HuntMode;
}

function syncHuntUrl(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  country: string,
  mode: HuntMode
) {
  const params = new URLSearchParams(searchParams.toString());
  if (country) params.set("country", country);
  else params.delete("country");
  if (mode && mode !== "any") params.set("huntMode", mode);
  else params.delete("huntMode");
  clearPageParam(params);
  router.push(`/dashboard/hunt?${params.toString()}`);
}

export function HuntSettingsControls({
  initialCountry,
  initialMode,
}: HuntSettingsControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [country, setCountry] = useState(initialCountry);
  const [mode, setMode] = useState(initialMode);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCountry(initialCountry);
    setMode(initialMode);
  }, [initialCountry, initialMode]);

  function persist(nextCountry: string, nextMode: HuntMode) {
    startTransition(async () => {
      try {
        await updateHuntPreferences({
          huntCountry: nextCountry || undefined,
          huntMode: nextMode,
        });
        syncHuntUrl(router, searchParams, nextCountry, nextMode);
        toast.success("Hunt settings updated");
      } catch (err) {
        setCountry(initialCountry);
        setMode(initialMode);
        toast.error(err instanceof Error ? err.message : "Failed to save hunt settings");
      }
    });
  }

  function handleCountryChange(value: string) {
    setCountry(value);
    persist(value, mode);
  }

  function handleModeChange(value: HuntMode) {
    setMode(value);
    persist(country, value);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Hunt target</p>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <HuntCountrySelect
          value={country}
          onChange={handleCountryChange}
          disabled={pending}
        />
        <HuntModeSelect value={mode} onChange={handleModeChange} disabled={pending} />
      </div>
      <p className="text-xs text-muted-foreground max-w-lg">
        Same options as Settings → Local hunt. Changes apply to the next country hunt and filter
        results below.
      </p>
    </div>
  );
}
