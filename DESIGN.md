---
name: Backoffice Admin Panel
description: Charcoal + Amber control terminal for brand operators — light cream continuum (locked), dark warm-charcoal continuum, amber accents.
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
  bg-light: "#FFF1DC"
  surface-light: "#FFF8EB"
  border-light: "#EADCC8"
  sidebar-light: "#FFE8CC"
  canvas-left-light: "#FFE8CC"
  canvas-right-light: "#FFF8EB"
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
  control: "8px"
  card: "16px"
  pill: "999px"
  nav: "10px"
  avatar-topbar: "12px"
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

- Light: orange→cream canvas continuum; warm cream sidebar; cream panels (`#FFF8EB`, not ivory/white). **Locked 2026-09-14.**
- Dark: warm charcoal→cool charcoal continuum; soft surfaces (not dead black); amber neon accents.

### Light mode surfaces (locked — copy exactly)

User-confirmed on Dashboard main pane (topbar + canvas + cards). Do not regress to `#FFFFFF` or near-white ivory `#FFFCF8`.

| Role | Hex | Notes |
|------|-----|-------|
| Sidebar (opaque) | `#FFE8CC` | Warmest peach; covers content when expanded |
| Canvas / `--bo-bg` | `#FFF1DC` | Cream under panels |
| Continuum L→R | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` | Canvas only; `background-attachment: fixed` |
| Surface / topbar / cards | `#FFF8EB` | Same cream as tip bg |
| Border | `#EADCC8` | Warm separator |
| Control well (currency seg etc.) | `#F5EBDC` | Slightly deeper cream inset |
| Accent-on (text on amber fill) | `#FFFFFF` | Only place pure white is allowed |

Reference CSS: `main-dashboard-executive.css` light tokens.

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
| Canvas / `--bo-bg` | `#FFF1DC` (warm cream under panels) | `#2C2E38` |
| Surface / cards / topbar | `#FFF8EB` cream (no ivory / no `#FFFFFF`) | `#383A46` |
| Border | `#EADCC8` | `rgba(255,255,255,.10)` |
| Text | `#18191C` | `#F5F5F4` |
| Text secondary | `#27272A` | `#E7E5E4` |
| Muted / time | `#71717A` | `#A1A1AA` |
| Control well | `#F0EFEA` | `rgba(255,255,255,.06)` |
| Placeholder | `#A1A1AA` | `#71717A` |

### Sidebar & canvas continuum

**Rule:** Only the **canvas** does sidebar→page transition. Sidebar itself is **opaque** (covers content when expanded). Panels/tables stay solid surface.

| Mode | Sidebar fill | Continuum (L→R, ~96px past sidebar) |
|------|--------------|-------------------------------------|
| Light | `#FFE8CC` | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` |
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

### Components (color + locked chrome)

| Element | Light | Dark |
|---------|-------|------|
| Primary CTA | amber gradient `#FBBF24`→`#F59E0B`→`#EA8608`, text white, border `#E8901A` | `#FBBF24`→`#F59E0B`→`#D97706`, text `#2A2C36`, border `#F59E0B` |
| Primary hover | reverse lift `#FCD34D`→`#FBBF24`→`#F59E0B`→`#EA8608` | reverse `#FDE68A`→`#FBBF24`→`#F59E0B` |
| Ghost / Export | `#FFF8EB`→`#F3E8D6`, border `#EADCC8`, text `#18191C` | `#4A4C58`→`#383A46`→`#2C2E38`, text `#F5F5F4` |
| Hover tip | `#FFF8EB` + amber border, text `#6b360c`, radius `8px` | `#40424E` + amber border, text `#F5F5F4`, radius `8px` |
| Money positive | `#B45309` | `#F59E0B` |
| Money zero | `#A1A1AA` | `#A1A1AA` |
| Modal z-index | above sidebar (`30000`); modals live under `body`, not inside `main` | same |
| Permission group (open) | cream `#FFFCF7` · head `#FFF8EB`→`#FFF1DC` · amber border | cool `#383A46` · open head `#40424E` · body `#2C2E38` · amber border only |
| Permission card | surface `#FFF8EB` · hover `#FFFCF7` · checked `#FFF8EB` · current `#FFF1DC` | `#2A2C36` · hover `#32343E` · checked/current amber tint only |

### Topbar chrome (locked — all pages)

Order: **Theme toggle** → divider → **User Name + avatar**.

**Theme toggle (`.bo-theme-btn`)**  
`36×36`, radius `8px`, transparent fill. Light: border `rgba(24,25,28,.18)`, icon `#3F3F46`. Dark: border `rgba(245,158,11,.4)`, icon `#F59E0B`. Hover dark → `#FBBF24`. Focus outline `#D97706`.

**User Name (`.bo-account-link`)**  
No bordered pill / no gear. Name `14px/700` (`#18191C` light · `#FFFFFF` dark). Role `11px` mono (`#71717A` light · `#F59E0B` dark). Avatar `40×40` radius `12px`: light `#D97706` / white icon; dark `#F59E0B` / `#2A2C36` icon + amber glow. Hover avatar: `#B45309` / `#FBBF24`.

### Buttons (locked metrics)

| Spec | Value |
|------|-------|
| Radius | `8px` |
| Height | `36px` default · `40px` modal · `42px` filter Reset/Add |
| Weight | `700` |
| Classes | Primary: `.mad-btn-primary` / `.mad-btn-navy` / `.bo-ui-button-primary` (all amber). Ghost: `.mad-btn-ghost` / Export |
| Motion | hover `-1px` · active `+1px` |
| Focus | amber 2px outline |

Do not freestyle topbar account chips or primary fills (no navy/cyan primary). Full tables live in `.interface-design/system.md` → Patterns.

### Permission matrix (Roles & Permissions)

Light: open groups use cream/amber wash; cards `#FFF8EB` → deeper cream on hover/checked/current.  
Dark: cool charcoal only (`#383A46` / `#40424E` / `#2C2E38` / `#2A2C36`) — **no** full-panel amber wash; amber only on borders, icons, counts, checked/current tint.  
Reference CSS: `menu-permission-executive.css`. Full tables in `.interface-design/system.md` → Patterns → Permission matrix.

## Typography

System UI stack. Hierarchy via weight + color. Sidebar L1 = `800`. Tabular nums for money/time; mono for credit/time cells and topbar role.

## Layout

Shell: sidebar + sticky topbar + main. One job per section. Touch targets ≥44px on coarse pointers.

## Elevation & Depth

Light: 1px border + soft warm shadow. Dark: surface lift via border; soft charcoal shadows only. Focus rings: amber (`rgba(217,119,6,.18)` / `rgba(245,158,11,.18)`).

## Shapes

Action controls / theme toggle `8px`, cards `16px`, topbar avatar `12px`, chart hover tip `.trend-tip` `8px`, pills/switches `999px`, nav ~`10px`.

## Do's and Don'ts

**Do**
- Keep light/dark parity when changing colors.
- Use continuum on canvas only; keep sidebar opaque; keep panels solid.
- Prefer `--bo-*` tokens; treat `--bo-cyan*` as amber.
- Copy Admin Detail topbar (theme + User Name) and Primary/Ghost button recipes on every migrated page.
- Override legacy light canvas (`reports.css` `.report-body{background:#f5f7fb!important}`) on every dark page, or white frames will leak.

**Don't**
- Reintroduce Deep Navy Cyan (`#123B66`, `#21A6D7`, `#072647`, `#08131F`, `#0B1626`, `#0F1F33`).
- Purple-on-white / indigo marketing gradients as product identity.
- Dead pure black (`#000` / `#0A0A0B`) for dark canvas.
- Muddy full-page orange wash under table panels.
- Invent a different User Name pill, theme-toggle size, or primary gradient per page.
- Assume writing tokens in MD alone paints the page — CSS must implement and win specificity wars.
