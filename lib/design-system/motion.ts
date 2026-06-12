import { motion as tokens } from "./tokens";

export const transition = {
  default: `all ${tokens.duration.normal} ${tokens.easing.smooth}`,
  fast: `all ${tokens.duration.fast} ${tokens.easing.default}`,
  colors: `color, background-color, border-color, fill, stroke ${tokens.duration.fast} ${tokens.easing.default}`,
  transform: `transform ${tokens.duration.normal} ${tokens.easing.spring}`,
  opacity: `opacity ${tokens.duration.fast} ${tokens.easing.default}`,
} as const;

export const animations = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  scaleIn: "animate-scale-in",
  shimmer: "animate-shimmer",
} as const;
