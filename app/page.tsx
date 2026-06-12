import Link from "next/link";
import { Sparkles, Search, FileText, BarChart3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">JobHunter AI</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm mb-6">
            <Bot className="h-4 w-4 text-primary" />
            Autonomous AI job hunting for developers
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl max-w-3xl mx-auto">
            Your personal AI agent that hunts jobs while you sleep
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            JobHunter AI searches job boards, scores opportunities against your profile,
            generates tailored resumes and cover letters, and tracks every application.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start hunting for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Auto job search",
                desc: "Scans RemoteOK, Wellfound, Greenhouse, Lever, and more every 6 hours.",
              },
              {
                icon: FileText,
                title: "Tailored applications",
                desc: "AI-generated resumes, cover letters, and recruiter outreach for each role.",
              },
              {
                icon: BarChart3,
                title: "Track & optimize",
                desc: "Analytics on response rates, interview prep, and weekly performance reports.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} JobHunter AI. Built for software developers.
      </footer>
    </div>
  );
}
