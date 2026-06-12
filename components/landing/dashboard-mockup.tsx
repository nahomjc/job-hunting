"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  LayoutDashboard,
  Bell,
  Settings,
  Sparkles,
  TrendingUp,
  MapPin,
  Wifi,
} from "lucide-react";
import { floatAnimation, floatAnimationSlow } from "./motion";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Briefcase, label: "Jobs" },
  { icon: Bell, label: "Alerts" },
  { icon: Settings, label: "Settings" },
];

const jobs = [
  { title: "Senior Full Stack Engineer", company: "Vercel", score: 94, remote: true },
  { title: "Staff Software Engineer", company: "Linear", score: 89, remote: true },
  { title: "Backend Engineer", company: "Stripe", score: 82, remote: false },
];

const stats = [
  { label: "Matches", value: "47", change: "+12 today" },
  { label: "Applied", value: "8", change: "3 pending" },
  { label: "Response rate", value: "38%", change: "+5% vs avg" },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
        initial={{ width: 0 }}
        whileInView={{ width: `${score}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function DashboardMockup() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-5xl"
      animate={floatAnimation}
    >
      {/* Glow behind mockup */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />

      <motion.div
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md bg-muted/60 text-[10px] text-muted-foreground">
            app.jobhunter.ai/dashboard
          </div>
        </div>

        <div className="flex min-h-[340px] md:min-h-[400px]">
          {/* Sidebar */}
          <div className="hidden w-44 shrink-0 border-r border-border/60 bg-muted/20 p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold">JobHunter</span>
            </div>
            {navItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Good morning, Alex</p>
                <p className="text-[10px] text-muted-foreground">Your agent found 12 new matches overnight</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Agent active
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/60 bg-background/50 p-2.5"
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold tabular-nums leading-tight">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Job cards */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Top matches
              </p>
              {jobs.map((job, i) => (
                <motion.div
                  key={job.title}
                  className="rounded-lg border border-border/60 bg-background/50 p-2.5"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{job.title}</p>
                      <p className="text-[10px] text-muted-foreground">{job.company}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {job.score}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ScoreBar score={job.score} />
                  </div>
                  <div className="mt-1.5 flex gap-2 text-[9px] text-muted-foreground">
                    {job.remote && (
                      <span className="flex items-center gap-0.5">
                        <Wifi className="h-2.5 w-2.5" /> Remote
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> Global
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating notification card */}
      <motion.div
        className="absolute -right-2 top-16 hidden rounded-xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-xl md:block lg:-right-8"
        animate={floatAnimationSlow}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium">New high match</p>
            <p className="text-[10px] text-muted-foreground">Senior Engineer @ Vercel — 94%</p>
          </div>
        </div>
      </motion.div>

      {/* Floating agent card */}
      <motion.div
        className="absolute -left-2 bottom-12 hidden md:block lg:-left-8"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          className="rounded-xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium">AI Agent running</p>
              <p className="text-[10px] text-muted-foreground">Scanning 8 job boards…</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
