import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobHunter AI — Autonomous Job Hunting Assistant",
  description:
    "AI-powered job hunting platform for software developers. Search, score, apply, and track opportunities automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "group !rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-lg",
                  title: "!text-sm !font-medium",
                  description: "!text-xs !text-muted-foreground",
                  actionButton: "!bg-primary !text-primary-foreground !rounded-lg",
                  cancelButton: "!bg-muted !text-muted-foreground !rounded-lg",
                },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
