"use client";

import { motion } from "framer-motion";
import { Search, FileText, MessageSquare, BarChart3, Zap, Shield, Clock, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fadeUp, staggerContainer } from "./motion";

const features = [
  {
    icon: Search,
    title: "Autonomous job search",
    description:
      "Scans 8+ job boards every 6 hours. Filters by your role, salary, location, and remote preferences automatically.",
    highlight: "8+ sources",
  },
  {
    icon: FileText,
    title: "AI resume optimization",
    description:
      "Generates role-specific resume versions that emphasize your most relevant skills and achievements for each application.",
    highlight: "Per-role tailoring",
  },
  {
    icon: MessageSquare,
    title: "Recruiter communication",
    description:
      "Drafts personalized cover letters and LinkedIn outreach messages aligned with each company's tone and job requirements.",
    highlight: "Personalized outreach",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    description:
      "Track match scores, application rates, response rates, and interview conversions with weekly AI-generated reports.",
    highlight: "Weekly insights",
  },
];

const extras = [
  { icon: Zap, label: "Runs every 6 hours" },
  { icon: Shield, label: "Your data stays private" },
  { icon: Clock, label: "Save 20+ hrs/week" },
  { icon: Globe, label: "Remote-first focus" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative border-t border-border/60 py-24 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full blur-3xl bg-primary/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-3">Features</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to land your next role
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A complete AI-powered job hunting stack — no spreadsheets, no manual copy-pasting.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} custom={i} variants={fadeUp}>
                <Card
                  variant="interactive"
                  className="group h-full p-6 md:p-8 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {feature.highlight}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {extras.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-primary/70" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
