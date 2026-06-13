"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, MessageSquare, BarChart3, Zap, Shield, Clock, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ease } from "./motion";

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

const CAROUSEL_INTERVAL = 3200;

function getStackPosition(relativeIndex: number) {
  switch (relativeIndex) {
    case 0:
      return { x: "-50%", y: 0, scale: 1, opacity: 1, rotate: 0, zIndex: 40, filter: "blur(0px)" };
    case 1:
      return {
        x: "-44%",
        y: 20,
        scale: 0.93,
        opacity: 0.7,
        rotate: 3,
        zIndex: 30,
        filter: "blur(0.5px)",
      };
    case 2:
      return {
        x: "-38%",
        y: 40,
        scale: 0.87,
        opacity: 0.48,
        rotate: -2.5,
        zIndex: 20,
        filter: "blur(1px)",
      };
    default:
      return {
        x: "-32%",
        y: 60,
        scale: 0.8,
        opacity: 0.32,
        rotate: 2,
        zIndex: 10,
        filter: "blur(1.5px)",
      };
  }
}

function FeatureCard({
  feature,
  index,
  scattered,
}: {
  feature: (typeof features)[number];
  index: number;
  scattered: boolean;
}) {
  const Icon = feature.icon;

  return (
    <Card
      variant="interactive"
      className={cn(
        "group h-full p-6 md:p-8 relative overflow-hidden",
        scattered && "cursor-default"
      )}
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
        {scattered && (
          <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {index + 1}
          </span>
        )}
        <h3 className="text-lg font-semibold tracking-tight mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </Card>
  );
}

function FeaturesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScattered, setIsScattered] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (isScattered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, [isScattered]);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease }}
      onViewportEnter={() => setHasEntered(true)}
    >
      <section
        className={cn(
          "relative transition-[min-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isScattered ? "min-h-0" : "mx-auto min-h-[340px] max-w-lg md:min-h-[380px] md:max-w-xl"
        )}
        onMouseEnter={() => setIsScattered(true)}
        onMouseLeave={() => setIsScattered(false)}
        aria-label="Feature carousel. Hover to expand all features."
      >
        <motion.div
          layout
          className={cn(
            isScattered ? "grid gap-5 sm:grid-cols-2" : "relative h-full w-full"
          )}
          transition={{ layout: { duration: 0.55, ease } }}
        >
          {features.map((feature, i) => {
            const relativeIndex = (i - activeIndex + features.length) % features.length;

            return (
              <motion.div
                key={feature.title}
                layout
                className={cn(!isScattered && "absolute left-1/2 top-0 w-full max-w-lg md:max-w-xl")}
                initial={false}
                animate={
                  isScattered
                    ? {
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        rotate: 0,
                        zIndex: i + 1,
                      }
                    : hasEntered
                      ? getStackPosition(relativeIndex)
                      : {
                          x: "-50%",
                          y: 40,
                          scale: 0.9,
                          opacity: 0,
                          rotate: 0,
                          zIndex: 0,
                        }
                }
                transition={{
                  duration: isScattered ? 0.55 : 0.65,
                  ease,
                  delay: isScattered ? i * 0.07 : hasEntered && relativeIndex === 0 ? 0 : i * 0.12,
                }}
              >
                <FeatureCard feature={feature} index={i} scattered={isScattered} />
              </motion.div>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {!isScattered && (
            <motion.div
              key="carousel-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2">
                {features.map((feature, i) => (
                  <button
                    key={feature.title}
                    type="button"
                    aria-label={`Show ${feature.title}`}
                    className="pointer-events-auto h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === activeIndex ? 24 : 8,
                      backgroundColor:
                        i === activeIndex ? "hsl(var(--primary))" : "hsl(var(--border))",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(i);
                    }}
                  />
                ))}
              </div>
              <p className="hidden text-xs text-muted-foreground/80 md:block">
                Hover to explore all features
              </p>
              <button
                type="button"
                className="pointer-events-auto rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsScattered(true);
                }}
              >
                View all features
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isScattered && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="mt-6 mx-auto flex rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
              onClick={() => setIsScattered(false)}
            >
              Back to carousel
            </motion.button>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative border-t border-border/60 py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full blur-3xl bg-primary/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-label mb-3">Features</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to land your next role
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A complete AI-powered job hunting stack — no spreadsheets, no manual copy-pasting.
          </p>
        </motion.div>

        <FeaturesCarousel />

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
