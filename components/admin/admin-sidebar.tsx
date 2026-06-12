"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Cpu,
  Bot,
  Shield,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Analytics",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/ai-usage", label: "AI Usage", icon: Cpu },
      { href: "/admin/agents", label: "Agent Monitoring", icon: Bot },
      { href: "/admin/security", label: "Security Logs", icon: Shield },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar hidden w-[260px] shrink-0 border-r border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-sidebar))] md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-[hsl(var(--admin-border))] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--admin-accent)/0.15)]">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-[hsl(var(--admin-foreground))]">
            JobHunter Admin
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--admin-muted))]">
            Internal
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--admin-muted))]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))]"
                        : "text-[hsl(var(--admin-muted))] hover:bg-[hsl(var(--admin-surface))] hover:text-[hsl(var(--admin-foreground))]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[hsl(var(--admin-border))] p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-[hsl(var(--admin-muted))] transition-colors hover:bg-[hsl(var(--admin-surface))] hover:text-[hsl(var(--admin-foreground))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
