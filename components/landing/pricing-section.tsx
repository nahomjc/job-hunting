"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "./motion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for exploring AI job hunting.",
    features: [
      "50 job scores per month",
      "2 job board sources",
      "Basic resume parsing",
      "Application tracking",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For active job seekers who want an edge.",
    features: [
      "Unlimited job scores",
      "All 8+ job board sources",
      "AI resume tailoring per role",
      "Cover letter generation",
      "Recruiter outreach drafts",
      "Weekly performance reports",
    ],
    cta: "Start Pro Trial",
    href: "/signup?plan=pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For bootcamps, career coaches, and agencies.",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared candidate pipeline",
      "Priority AI model access",
      "Custom job board integrations",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/signup?plan=team",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60 py-24 md:py-32 bg-grid">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-3">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Start free. Upgrade when you&apos;re ready to go all-in on your job search.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {plans.map((plan, i) => (
            <motion.div key={plan.name} custom={i} variants={fadeUp}>
              <Card
                variant={plan.popular ? "glow" : "default"}
                className={cn(
                  "relative flex h-full flex-col p-6 md:p-8",
                  plan.popular && "border-primary/30"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "premium" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
