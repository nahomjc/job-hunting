"use client";

import Link from "next/link";
import { Logo } from "@/components/design-system/logo";
import { AuthBackground } from "./auth-background";
import { AuthBrandPanel } from "./auth-brand-panel";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col">
        <AuthBackground />

        {/* Mobile header */}
        <div className="relative z-10 flex items-center justify-between p-4 lg:hidden">
          <Logo href="/" />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <div className="relative z-10 pb-6 text-center lg:hidden">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
