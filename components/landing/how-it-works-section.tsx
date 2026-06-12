"use client";

import { motion } from "framer-motion";
import { Search, Target, FileText, Mail, ClipboardList } from "lucide-react";
import { fadeUp, staggerContainer } from "./motion";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "AI finds jobs",
    description:
      "Your agent scans RemoteOK, Remotive, Himalayas, Greenhouse, Lever, and more — every 6 hours, automatically.",
  },
  {
    step: "02",
    icon: Target,
    title: "AI analyzes fit",
    description:
      "Each role is scored against your skills, experience, and preferences. Only high-match opportunities surface.",
  },
  {
    step: "03",
    icon: FileText,
    title: "AI customizes resume",
    description:
      "Tailored resume versions highlight the most relevant experience for each specific role and company.",
  },
  {
    step: "04",
    icon: Mail,
    title: "AI drafts outreach",
    description:
      "Personalized cover letters and recruiter messages crafted to match the job description and company culture.",
  },
  {
    step: "05",
    icon: ClipboardList,
    title: "AI tracks applications",
    description:
      "Every application, response, and interview is tracked in one dashboard with weekly performance reports.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-3">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            From job board to offer letter — on autopilot
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Five autonomous steps that run while you focus on what matters.
          </p>
        </motion.div>

        <motion.div
          className="relative"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Connecting line — desktop */}
          <div className="absolute left-8 top-8 bottom-8 hidden w-px bg-gradient-to-b from-primary/40 via-border to-transparent md:block" />

          <div className="space-y-6 md:space-y-4">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  custom={i}
                  variants={fadeUp}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/50 p-6 transition-colors hover:border-primary/20 hover:bg-card md:flex-row md:items-start md:gap-6"
                >
                  <div className="flex items-center gap-4 md:flex-col md:items-center md:gap-2 md:w-16 shrink-0">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-primary border border-primary/20">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{item.step}</span>
                      <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
