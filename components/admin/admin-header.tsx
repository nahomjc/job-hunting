"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function AdminHeader({ title, description, badge }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[hsl(var(--admin-muted))] hover:text-[hsl(var(--admin-foreground))]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[hsl(var(--admin-muted))] hover:text-[hsl(var(--admin-foreground))]"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
