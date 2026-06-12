"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Does JobHunter AI apply to jobs automatically?",
    answer:
      "No — JobHunter AI finds, scores, and prepares applications but you stay in control. It generates tailored resumes, cover letters, and outreach drafts. You review and submit when ready.",
  },
  {
    question: "Which job boards does it search?",
    answer:
      "RemoteOK, Remotive, Arbeitnow, RemoteJobs.org, Himalayas, JobsBase, RemNavi, and optionally Greenhouse, Lever, and custom career pages. We add new sources regularly.",
  },
  {
    question: "How does the AI scoring work?",
    answer:
      "Each job is analyzed against your profile — skills, experience level, salary expectations, location preferences, and remote requirements. You get a 0–100 match score with specific reasons.",
  },
  {
    question: "Is my resume and personal data secure?",
    answer:
      "Yes. Your data is encrypted at rest and in transit. We never share your information with third parties. You can delete your account and all data at any time.",
  },
  {
    question: "Can I use it while employed?",
    answer:
      "Absolutely. JobHunter AI runs quietly in the background. No LinkedIn activity, no public profile changes. Perfect for confidential job searches.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "50 job scores per month, basic resume parsing, application tracking, and access to 2 job board sources. Enough to evaluate the platform before upgrading.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium leading-snug md:text-base">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border/60 py-24 md:py-32 bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-3">FAQ</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border/60 bg-card/50 px-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
