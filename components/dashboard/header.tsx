"use client";

import { HeaderUserMenu } from "@/components/dashboard/header-user-menu";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="animate-fade-in">
        <h1 className="text-heading">{title}</h1>
        {description && <p className="text-caption mt-0.5">{description}</p>}
      </div>
      <HeaderUserMenu />
    </header>
  );
}
