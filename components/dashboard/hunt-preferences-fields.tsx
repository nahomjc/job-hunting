"use client";

import { Label } from "@/components/ui/label";
import {
  SERVICE_OPTIONS,
  type HuntMode,
  type ServiceOffered,
} from "@/lib/jobs/hunt-preferences";
import type { Profile } from "@/lib/db/schema";
import { HuntCountrySelect, HuntModeSelect } from "@/components/dashboard/hunt-select-fields";

interface HuntPreferencesFieldsProps {
  profile: Profile | null;
  huntCountry: string;
  huntMode: HuntMode;
  servicesOffered: ServiceOffered[];
  onHuntCountryChange: (value: string) => void;
  onHuntModeChange: (value: HuntMode) => void;
  onServicesChange: (value: ServiceOffered[]) => void;
}

export function HuntPreferencesFields({
  huntCountry,
  huntMode,
  servicesOffered,
  onHuntCountryChange,
  onHuntModeChange,
  onServicesChange,
}: HuntPreferencesFieldsProps) {
  function toggleService(service: ServiceOffered) {
    if (servicesOffered.includes(service)) {
      onServicesChange(servicesOffered.filter((s) => s !== service));
    } else {
      onServicesChange([...servicesOffered, service]);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-medium">Job hunt region</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Target a country for remote or on-site roles. Used when you run Job Hunter.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HuntCountrySelect value={huntCountry} onChange={onHuntCountryChange} />
        <HuntModeSelect value={huntMode} onChange={onHuntModeChange} />
      </div>
      <div className="space-y-2">
        <Label>Services I offer (for pitch letters)</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((opt) => {
            const active = servicesOffered.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleService(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
