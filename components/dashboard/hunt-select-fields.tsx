import { Label } from "@/components/ui/label";
import { HUNT_COUNTRIES, HUNT_MODES, type HuntMode } from "@/lib/jobs/hunt-preferences";
import { cn } from "@/lib/utils";

export const HUNT_SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface HuntCountrySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function HuntCountrySelect({
  id = "huntCountry",
  value,
  onChange,
  disabled,
  className,
  label = "Hunt country",
}: HuntCountrySelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={HUNT_SELECT_CLASS}
      >
        {HUNT_COUNTRIES.map((c) => (
          <option key={c.code || "any"} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface HuntModeSelectProps {
  id?: string;
  value: HuntMode;
  onChange: (value: HuntMode) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function HuntModeSelect({
  id = "huntMode",
  value,
  onChange,
  disabled,
  className,
  label = "Hunt mode",
}: HuntModeSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as HuntMode)}
        disabled={disabled}
        className={HUNT_SELECT_CLASS}
      >
        {HUNT_MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
