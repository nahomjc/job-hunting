"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileUp,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "./motion";

const steps = [
  {
    icon: Upload,
    title: "Upload your CV",
    description:
      "Drop a PDF or paste your resume once. We read your experience, education, and tech stack — no manual form filling.",
  },
  {
    icon: Sparkles,
    title: "Skills extracted automatically",
    description:
      "AI builds a structured profile from your CV: roles, years of experience, languages, frameworks, and preferences.",
  },
  {
    icon: Target,
    title: "Jobs matched to your skills",
    description:
      "Your agent searches job boards and scores every listing against your profile. High-fit roles rise to the top.",
  },
  {
    icon: Briefcase,
    title: "Apply and land the role",
    description:
      "Review scored matches, tailor your resume per role, and track applications until you get the offer.",
  },
];

const extractedSkills = ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"];

const matchedJobs = [
  { title: "Senior Full Stack Engineer", company: "Vercel", score: 94 },
  { title: "Staff Software Engineer", company: "Linear", score: 89 },
  { title: "Backend Engineer", company: "Stripe", score: 82 },
];

function JourneyVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-primary/5 blur-2xl" />

      <motion.div
        className="relative space-y-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-xl md:p-6"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Step 1: CV upload */}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">resume_sarah_dev.pdf</p>
              <p className="text-xs text-muted-foreground">Uploaded · parsing with AI…</p>
            </div>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          </div>
        </div>

        <FlowArrow />

        {/* Step 2: Skills */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Skills detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extractedSkills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
              >
                <Badge variant="secondary" className="text-xs font-normal">
                  {skill}
                </Badge>
              </motion.span>
            ))}
          </div>
        </div>

        <FlowArrow />

        {/* Step 3: Job matches */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Matched jobs
            </p>
            <Badge variant="outline" className="text-[10px]">
              47 found
            </Badge>
          </div>
          <div className="space-y-2.5">
            {matchedJobs.map((job, i) => (
              <motion.div
                key={job.title}
                className="rounded-lg border border-border/60 bg-background/80 px-3 py-2.5"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {job.score}%
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${job.score}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <FlowArrow />

        {/* Step 4: Success */}
        <motion.div
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-medium">Offer received</p>
            <p className="text-xs text-muted-foreground">Senior Full Stack Engineer · Vercel</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5">
      <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground/50 md:rotate-90" />
    </div>
  );
}

export function CandidateJourneySection() {
  return (
    <section id="journey" className="border-t border-border/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              className="mb-10 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-label mb-3">Your path to a new role</p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Upload your CV. Get matched. Land the job.
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Start with your resume — we extract your skills, search thousands of listings,
                and surface the roles that actually fit your background.
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    custom={i}
                    variants={fadeUp}
                    className="group flex gap-4 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/20 hover:bg-card/70"
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10",
                        "transition-colors group-hover:bg-primary/15"
                      )}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="mb-0.5 flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-semibold tracking-tight">{step.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Button variant="premium" size="lg" asChild>
                <Link href="/signup">
                  Upload your CV — it&apos;s free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          <JourneyVisual />
        </div>
      </div>
    </section>
  );
}
