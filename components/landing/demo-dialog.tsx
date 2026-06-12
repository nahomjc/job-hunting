"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Search, Target, FileText, Mail, ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DemoDialogProps {
  children: React.ReactNode;
}

const steps = [
  { icon: Search, label: "Searching job boards" },
  { icon: Target, label: "Scoring 94% match" },
  { icon: FileText, label: "Tailoring resume" },
  { icon: Mail, label: "Drafting outreach" },
  { icon: ClipboardList, label: "Tracking application" },
];

function DemoAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(280,80%,60%/0.05)]" />

      <div className="relative flex h-full flex-col items-center justify-center p-8">
        <motion.div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>

        <p className="mb-8 text-sm font-medium">JobHunter AI Agent</p>

        <div className="w-full max-w-xs space-y-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            const isDone = i < activeStep;

            return (
              <motion.div
                key={step.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isDone
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
                animate={isActive ? { x: [0, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{step.label}</span>
                {isDone && <span className="ml-auto text-success text-xs">✓</span>}
                {isActive && (
                  <motion.span
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DemoDialog({ children }: DemoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            See JobHunter AI in action
          </DialogTitle>
          <DialogDescription>
            Watch how the AI agent autonomously finds, scores, and prepares applications for you.
          </DialogDescription>
        </DialogHeader>
        <DemoAnimation />
      </DialogContent>
    </Dialog>
  );
}
