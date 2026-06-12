/**
 * JobHunter AI — Design System Tokens
 * Inspired by Linear, Vercel, Stripe, Cursor
 */

export const colors = {
  light: {
    background: "hsl(0 0% 99%)",
    foreground: "hsl(240 10% 4%)",
    muted: "hsl(240 5% 96%)",
    mutedForeground: "hsl(240 4% 46%)",
    border: "hsl(240 6% 90%)",
    primary: "hsl(234 89% 62%)",
    primaryForeground: "hsl(0 0% 100%)",
    accent: "hsl(234 100% 97%)",
    success: "hsl(152 69% 40%)",
    warning: "hsl(38 92% 50%)",
    destructive: "hsl(0 72% 51%)",
  },
  dark: {
    background: "hsl(240 6% 4%)",
    foreground: "hsl(0 0% 98%)",
    muted: "hsl(240 4% 10%)",
    mutedForeground: "hsl(240 5% 58%)",
    border: "hsl(240 4% 14%)",
    primary: "hsl(234 85% 68%)",
    primaryForeground: "hsl(240 6% 4%)",
    accent: "hsl(240 4% 12%)",
    success: "hsl(152 60% 48%)",
    warning: "hsl(38 92% 55%)",
    destructive: "hsl(0 62% 55%)",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  scale: {
    xs: { size: "0.75rem", lineHeight: "1rem", letterSpacing: "0.01em" },
    sm: { size: "0.8125rem", lineHeight: "1.25rem", letterSpacing: "0.005em" },
    base: { size: "0.9375rem", lineHeight: "1.5rem", letterSpacing: "0" },
    lg: { size: "1.0625rem", lineHeight: "1.625rem", letterSpacing: "-0.01em" },
    xl: { size: "1.25rem", lineHeight: "1.75rem", letterSpacing: "-0.015em" },
    "2xl": { size: "1.5rem", lineHeight: "2rem", letterSpacing: "-0.02em" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem", letterSpacing: "-0.025em" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem", letterSpacing: "-0.03em" },
    display: { size: "3rem", lineHeight: "1.1", letterSpacing: "-0.04em" },
  },
} as const;

export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radius = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  full: "9999px",
} as const;

export const shadows = {
  xs: "0 1px 2px hsl(240 10% 4% / 0.04)",
  sm: "0 1px 3px hsl(240 10% 4% / 0.06), 0 1px 2px hsl(240 10% 4% / 0.04)",
  md: "0 4px 12px hsl(240 10% 4% / 0.08), 0 2px 4px hsl(240 10% 4% / 0.04)",
  lg: "0 12px 32px hsl(240 10% 4% / 0.12), 0 4px 8px hsl(240 10% 4% / 0.06)",
  glow: "0 0 0 1px hsl(234 89% 62% / 0.12), 0 8px 24px hsl(234 89% 62% / 0.15)",
  glowLg: "0 0 0 1px hsl(234 89% 62% / 0.2), 0 16px 48px hsl(234 89% 62% / 0.2)",
} as const;

export const motion = {
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;
