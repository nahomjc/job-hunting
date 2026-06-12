"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Search, Target, FileText, TrendingUp } from "lucide-react";
import { Logo } from "@/components/design-system/logo";

const highlights = [
  { icon: Search, text: "Scans 8+ job boards every 6 hours" },
  { icon: Target, text: "AI scores every role against your profile" },
  { icon: FileText, text: "Tailored resumes for each application" },
  { icon: TrendingUp, text: "Track response rates & interviews" },
];

const stats = [
  { value: "47", label: "Avg. matches/week" },
  { value: "94%", label: "Top match accuracy" },
  { value: "20h", label: "Saved per week" },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[55%]">
      {/* Deep gradient panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      <motion.div
        className="absolute top-1/4 -left-20 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "hsl(var(--primary) / 0.15)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-0 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "hsl(280 70% 60% / 0.1)" }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col justify-between p-10 xl:p-14 w-full">
        <Logo href="/" />

        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered job hunting
            </div>
            <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl leading-tight">
              Land your next role on autopilot
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              JobHunter AI finds, scores, and prepares applications while you focus on
              interviewing and growing your career.
            </p>
          </motion.div>

          <motion.ul
            className="mt-10 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {highlights.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                className="flex items-center gap-3 text-sm text-foreground/80"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {text}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="flex gap-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
