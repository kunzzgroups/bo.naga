---
name: Backoffice Admin Panel
description: Charcoal + Amber control terminal for brand operators — light orange→white continuum, dark warm-charcoal continuum, amber accents.
colors:
  primary-light: "#D97706"
  primary-deep-light: "#B45309"
  primary-bright-light: "#F59E0B"
  secondary-light: "#2563EB"
  success-light: "#12B76A"
  danger-light: "#991B1B"
  text-light: "#18191C"
  text-secondary-light: "#27272A"
  muted-light: "#71717A"
  bg-light: "#F7F6F3"
  surface-light: "#FFFFFF"
  border-light: "#E4E4E7"
  sidebar-light: "#FFE8CC"
  canvas-left-light: "#FFE8CC"
  canvas-right-light: "#FFFFFF"
  tip-bg-light: "#FFF8EB"
  tip-text-light: "#6b360c"
  money-positive-light: "#B45309"
  primary-dark: "#F59E0B"
  primary-deep-dark: "#D97706"
  success-dark: "#10B981"
  danger-dark: "#F87171"
  text-dark: "#F5F5F4"
  text-secondary-dark: "#E7E5E4"
  muted-dark: "#A1A1AA"
  bg-dark: "#2C2E38"
  surface-dark: "#383A46"
  border-dark: "rgba(255,255,255,0.10)"
  sidebar-dark: "#3A3226"
  canvas-left-dark: "#3A3226"
  canvas-right-dark: "#2C2E38"
  tip-bg-dark: "#40424E"
  money-positive-dark: "#F59E0B"
  accent-on-dark: "#2A2C36"
typography:
  ui:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  sidebar-l1:
    fontWeight: 800
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  control: "10px"
  card: "16px"
  pill: "999px"
  nav: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# Design System — Charcoal + Amber

**Source of truth for all BO UI going forward.** Reference implementation: Admin Detail (`data-access-page="main_admin_detail"`).

Former **Deep Navy Cyan** (`#123B66` / `#21A6D7` / `#072647` / `#08131F`) is **retired**. Do not reintroduce navy/cyan as brand identity.

## Overview

Backoffice is a desktop-first ops panel. Visual world: **Charcoal structure + Amber interaction**.

- Light: orange→white canvas continuum; warm cream sidebar; white panels.
- Dark: warm charcoal→cool charcoal continuum; soft surfaces (not dead black); amber neon accents.

Theme toggle: `data-bo-theme` / `localStorage.bo_theme`. Prefer `--bo-*` tokens over hard-coded hex in new work.

> Token names `--bo-navy` / `--bo-cyan` remain in CSS for compatibility but now map to **neutral text / amber accent**, not navy/cyan hues.

## Colors

### Brand roles

| Role | Light | Dark |
|------|-------|------|
| Primary (CTA, active, focus) | `#D97706` | `#F59E0B` |
| Primary deep (hover / money+) | `#B45309` | `#D97706` |
| Bright amber (highlights) | `#F59E0B` | `#FBBF24` |
| Secondary (info / rare) | `#2563EB` | `#D97706` |
| Success | `#12B76A` | `#10B981` |
| Danger | `#991B1B` | `#F87171` |
| Accent-on (text on primary fill) | `#FFFFFF` | `#2A2C36` |

### Surfaces & text

| Role | Light | Dark |
|------|-------|------|
| Canvas / `--bo-bg` | `#F7F6F3` (panels sit on continuum white) | `#2C2E38` |
| Surface / cards / topbar | `#FFFFFF` | `#383A46` |
| Border | `#E4E4E7` | `rgba(255,255,255,.10)` |
| Text | `#18191C` | `#F5F5F4` |
| Text secondary | `#27272A` | `#E7E5E4` |
| Muted / time | `#71717A` | `#A1A1AA` |
| Control well | `#F0EFEA` | `rgba(255,255,255,.06)` |
| Placeholder | `#A1A1AA` | `#71717A` |

### Sidebar & canvas continuum

**Rule:** Only the **canvas** does sidebar→page transition. Sidebar itself is **opaque** (covers content when expanded). Panels/tables stay solid surface.

| Mode | Sidebar fill | Continuum (L→R, ~96px past sidebar) |
|------|--------------|-------------------------------------|
| Light | `#FFE8CC` | `#FFE8CC` → `#FFF1DC` → `#FFF8EB` → `#FFFCF7` → `#FFFFFF` |
| Dark | `#3A3226` | `#3A3226` → `#342E28` → `#2F2E32` → `#2D2E36` → `#2C2E38` |

Sidebar edge rail: 2px amber gradient (`#F59E0B` → `#D97706`).  
Nav L1 weight: `font-weight: 800`. Light nav text/icons: `#6b360c`.

### CSS token map (compatibility)

| Token | Light | Dark |
|-------|-------|------|
| `--bo-navy` | `#18191C` | `#F5F5F4` |
| `--bo-cyan` | `#D97706` | `#F59E0B` |
| `--bo-cyan-deep` | `#B45309` | `#D97706` |
| `--bo-ui-blue` | `#D97706` | `#F59E0B` |
| `--bo-sidebar-active` | `#D97706` | `#F59E0B` |
| `--bo-sidebar-active-bg` | `#FFE8CC` | `rgba(245,158,11,.14)` |
| `--bo-cyan-tint` | `rgba(217,119,6,.12)` | `rgba(245,158,11,.16)` |

### Components (color)

| Element | Light | Dark |
|---------|-------|------|
| Primary CTA | amber gradient `#FBBF24`→`#F59E0B`→`#EA8608`, text white | same family; text near `#2A2C36` when needed |
| Ghost / Export | soft gray gradient | `#4A4C58`→`#383A46`→`#2C2E38` |
| Hover tip | `#FFF8EB` + amber border, text `#6b360c`, radius `999px` | `#40424E` + amber border, text `#F5F5F4` |
| Money positive | `#B45309` | `#F59E0B` |
| Money zero | `#A1A1AA` | `#A1A1AA` |
| Modal z-index | above sidebar (`30000`); modals live under `body`, not inside `main` | same |

## Typography

System UI stack. Hierarchy via weight + color. Sidebar L1 = `800`. Tabular nums for money/time; mono for credit/time cells.

## Layout

Shell: sidebar + sticky topbar + main. One job per section. Touch targets ≥44px on coarse pointers.

## Elevation & Depth

Light: 1px border + soft warm shadow. Dark: surface lift via border; soft charcoal shadows only. Focus rings: amber (`rgba(217,119,6,.18)` / `rgba(245,158,11,.18)`).

## Shapes

Controls ~10px, cards 16px, pills/switches/tips `999px`, nav ~10px.

## Do's and Don'ts

**Do**
- Keep light/dark parity when changing colors.
- Use continuum on canvas only; keep sidebar opaque; keep panels solid.
- Prefer `--bo-*` tokens; treat `--bo-cyan*` as amber.

**Don't**
- Reintroduce Deep Navy Cyan (`#123B66`, `#21A6D7`, `#072647`, `#08131F`, `#0B1626`, `#0F1F33`).
- Purple-on-white / indigo marketing gradients as product identity.
- Dead pure black (`#000` / `#0A0A0B`) for dark canvas.
- Muddy full-page orange wash under table panels.
