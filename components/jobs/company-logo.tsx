import { cn, companyHue, companyInitials } from "@/lib/utils";

interface CompanyLogoProps {
  company: string;
  size?: "sm" | "md";
  className?: string;
}

export function CompanyLogo({ company, size = "md", className }: CompanyLogoProps) {
  const hue = companyHue(company);
  const initials = companyInitials(company);
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg font-semibold tracking-tight",
        "ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105",
        dim,
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 65% 45% / 0.9), hsl(${(hue + 40) % 360} 60% 35% / 0.85))`,
        color: "hsl(0 0% 98%)",
      }}
      title={company}
    >
      {initials || "?"}
    </div>
  );
}
