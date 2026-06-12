"use client";

import { motion } from "framer-motion";

export function AgentActivityBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <motion.div
        className="absolute top-0 left-1/4 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "hsl(var(--primary) / 0.08)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "hsl(270 70% 60% / 0.06)" }}
        animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
