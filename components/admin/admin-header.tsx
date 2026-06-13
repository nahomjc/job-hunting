"use client";

import { AdminUserMenu } from "@/components/admin/admin-user-menu";

interface AdminHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function AdminHeader({ title, description, badge }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg)/0.85)] px-6 py-4 backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-[hsl(var(--admin-foreground))]">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--admin-muted))]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-[13px] text-[hsl(var(--admin-muted))]">{description}</p>
        )}
      </div>
      <AdminUserMenu />
    </header>
  );
}
