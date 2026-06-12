"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "./animated-background";
import { DashboardMockup } from "./dashboard-mockup";
import { DemoDialog } from "./demo-dialog";
import { fadeUp } from "./motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <AnimatedBackground />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Autonomous AI job hunting for developers
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.08]"
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            Your AI Agent That Finds Jobs{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-[hsl(280,80%,65%)] bg-clip-text text-transparent">
              While You Sleep
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-muted-foreground leading-relaxed md:text-xl"
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            JobHunter AI searches job boards, scores every role against your profile,
            tailors your resume, drafts outreach — and tracks it all from one dashboard.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Button size="lg" variant="premium" asChild className="w-full sm:w-auto">
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <DemoDialog>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Play className="h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </DemoDialog>
          </motion.div>

          <motion.p
            className="mt-4 text-xs text-muted-foreground"
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            No credit card required · Free tier includes 50 job scores/month
          </motion.p>
        </div>

        <motion.div
          className="mt-16 md:mt-20"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
