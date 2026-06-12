"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fadeUp, staggerContainer } from "./motion";

const testimonials = [
  {
    quote:
      "I went from spending 3 hours a day on job boards to checking my dashboard once in the morning. Landed 4 interviews in two weeks.",
    author: "Sarah Chen",
    role: "Senior Frontend Engineer",
    company: "ex-Meta",
    avatar: "SC",
  },
  {
    quote:
      "The resume tailoring alone is worth it. Each application feels genuinely customized — recruiters actually respond now.",
    author: "Marcus Johnson",
    role: "Full Stack Developer",
    company: "Bootcamp grad → Series B startup",
    avatar: "MJ",
  },
  {
    quote:
      "As a staff engineer job searching quietly, JobHunter AI let me explore opportunities without the LinkedIn noise. Got my dream role in 6 weeks.",
    author: "Priya Patel",
    role: "Staff Software Engineer",
    company: "ex-Stripe",
    avatar: "PP",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-border/60 py-24 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-3">Testimonials</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Loved by developers landing their next role
          </h2>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {testimonials.map((t, i) => (
            <motion.div key={t.author} custom={i} variants={fadeUp}>
              <Card variant="glass" className="flex h-full flex-col p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
