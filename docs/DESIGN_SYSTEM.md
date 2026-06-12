# JobHunter AI — Design System

Premium, enterprise-grade design language inspired by **Linear**, **Vercel**, **Stripe**, and **Cursor**.

---

## Philosophy

| Principle | Implementation |
|-----------|----------------|
| Minimal | Restrained color, generous whitespace, no decorative clutter |
| Premium | Subtle glass surfaces, glow shadows, refined typography |
| Futuristic | Electric indigo accent, grid/mesh backgrounds, smooth motion |
| Polished | Consistent 200ms transitions, micro-interactions on hover |

---

## File Structure

```
lib/design-system/
  tokens.ts      — Colors, typography, spacing, radius, shadows, motion
  motion.ts      — Transition presets and animation class names
  index.ts       — Barrel export

app/globals.css  — CSS variables (light/dark), utilities, keyframes

components/ui/   — Reusable primitives (Button, Card, Dialog, …)
components/design-system/
  typography.tsx — Typography component wrapper
```

---

## Typography Scale

| Token | Size | Use |
|-------|------|-----|
| `text-display` | 3rem | Hero headlines |
| `text-heading` | 1.5rem | Page titles |
| `text-subheading` | 1.0625rem | Section titles |
| `text-body` | 0.9375rem | Body copy (default) |
| `text-caption` | 0.8125rem | Secondary text |
| `text-label` | 0.75rem | Uppercase labels |
| `text-mono` | 0.8125rem | Code, IDs |

**Font:** Geist Sans (UI), Geist Mono (code). Tight negative letter-spacing on headings.

```tsx
import { Typography } from "@/components/design-system/typography";

<Typography variant="heading" as="h1">Dashboard</Typography>
```

---

## Color Palette

### Brand — Electric Indigo

| Mode | Primary | Background | Foreground |
|------|---------|------------|------------|
| Light | `hsl(234 89% 62%)` | `hsl(0 0% 99%)` | `hsl(240 10% 4%)` |
| Dark | `hsl(234 85% 68%)` | `hsl(240 6% 4%)` | `hsl(0 0% 98%)` |

### Semantic

- **Success:** Green — match scores ≥ 80%
- **Warning:** Amber — match scores 60–79%
- **Destructive:** Red — errors, delete actions

All colors are defined as HSL CSS variables in `globals.css` and mapped to Tailwind via `@theme inline`.

---

## Spacing System

4px base grid. Key values:

| Token | Value | Use |
|-------|-------|-----|
| `1` | 4px | Tight gaps |
| `2` | 8px | Icon gaps |
| `3` | 12px | Nav padding |
| `4` | 16px | Card padding (sm) |
| `6` | 24px | Card padding (default) |
| `8` | 32px | Section gaps |
| `12` | 48px | Page sections |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, small chips |
| `--radius-md` | 8px | Inputs, small buttons |
| `--radius-lg` | 12px | Buttons, cards (default) |
| `--radius-xl` | 16px | Modals, large cards |
| `--radius-2xl` | 20px | Hero elements |

---

## Shadows

| Token | Use |
|-------|-----|
| `--shadow-xs` | Inputs |
| `--shadow-sm` | Default cards |
| `--shadow-md` | Elevated cards |
| `--shadow-lg` | Dropdowns, popovers |
| `--shadow-glow` | Primary CTAs, active states (indigo halo) |

---

## Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="premium">Premium CTA</Button>  // Shimmer + glow
<Button variant="link">Link</Button>
```

**Sizes:** `sm`, `default`, `lg`, `icon`, `icon-sm`

**Micro-interactions:** `active:scale-[0.98]`, 200ms smooth easing, focus ring.

---

## Card Variants

```tsx
<Card variant="default">Standard</Card>
<Card variant="elevated">Raised shadow</Card>
<Card variant="glass">Frosted glass</Card>
<Card variant="interactive">Hover lift + glow</Card>
<Card variant="glow">Primary glow border</Card>
<Card variant="flat">Muted background</Card>
```

---

## Modal (Dialog)

Built on Radix Dialog with overlay blur and scale-in animation.

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
```

---

## Surface Utilities

| Class | Effect |
|-------|--------|
| `.surface-glass` | Frosted card with backdrop blur |
| `.surface-elevated` | Card + medium shadow |
| `.surface-interactive` | Hover lift, shadow, border glow (dark) |
| `.bg-grid` | Subtle 64px grid background |
| `.bg-mesh` | Radial primary gradient hero background |

---

## Animations

| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Opacity 0 → 1 |
| `.animate-slide-up` | Fade + 8px upward |
| `.animate-scale-in` | Fade + scale 0.96 → 1 |
| `.animate-shimmer` | Loading skeleton sweep |
| `.stagger-children` | Staggered slide-up on children |

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth), spring for scale-in.

**Durations:** 150ms (fast), 200ms (normal), 300ms (slow).

---

## Dark / Light Mode

- Default theme: **dark** (enterprise aesthetic)
- Toggle via header sun/moon button
- CSS variables swap in `.dark` class on `<html>`
- `ThemeProvider` wraps app in `app/layout.tsx`

---

## Usage Guidelines

1. **Prefer design tokens** — Use CSS variables and Tailwind semantic colors (`bg-primary`, `text-muted-foreground`) over hardcoded hex.
2. **One accent** — Primary indigo for CTAs and active states only.
3. **Motion with purpose** — Use animations on page enter and interactive feedback, not decoration.
4. **Glass sparingly** — Auth cards, sticky headers, sidebar. Not every surface.
5. **Typography hierarchy** — One `text-heading` per page, `text-label` for section labels.

---

## Import Cheatsheet

```tsx
// Tokens (JS)
import { colors, typography, spacing, radius, shadows, motion } from "@/lib/design-system";

// Primitives
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { Typography } from "@/components/design-system/typography";
```
