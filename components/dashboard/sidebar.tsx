"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Calendar,
  Bell,
  Settings,
  Sparkles,
  ClipboardList,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agent Activity", icon: Bot },
  { href: "/dashboard/jobs", label: "Jobs Found", icon: Briefcase },
  { href: "/dashboard/applications", label: "Application Tracker", icon: ClipboardList },
  { href: "/dashboard/interviews", label: "Interviews", icon: Calendar },
  { href: "/dashboard/resumes", label: "Resume Versions", icon: FileText },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/50 backdrop-blur-xl md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-base font-semibold tracking-tight">JobHunter AI</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="px-3 py-2 text-label">Platform</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <Separator className="mb-3 opacity-60" />
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-medium">AI Agent</p>
          <p className="text-xs text-muted-foreground mt-0.5">Runs every 6 hours</p>
        </div>
      </div>
    </aside>
  );
}
