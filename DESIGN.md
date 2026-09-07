---
name: Backoffice Executive Panel
description: Deep Navy Cyan ops dashboard for brand executives — accurate KPIs, simple controls, light and dark modes.
colors:
  navy: "#123B66"
  cyan: "#21A6D7"
  success: "#12B76A"
  danger: "#EF3340"
  bg-light: "#F5F8FB"
  surface-light: "#FFFFFF"
  border-light: "#E2E7F0"
  text-light: "#11203A"
  text-secondary-light: "#1C2942"
  muted-light: "#657187"
  sidebar-light: "#072647"
  bg-dark: "#08131F"
  surface-dark: "#102030"
  border-dark: "rgba(255,255,255,0.08)"
  text-dark: "#F5F8FB"
  text-secondary-dark: "#D0D7E2"
  muted-dark: "#8A95A8"
  sidebar-dark: "#08131F"
  chart-merchant: "#1688F8"
  chart-game: "#8248E9"
  chart-net: "#16B45D"
typography:
  ui:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  kpi-value:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(28px, 5vw, 44px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  kpi-label:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.06em"
  meta:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 550
    lineHeight: 1.45
rounded:
  control: "10px"
  theme: "11px"
  card: "16px"
  chip: "8px"
  nav: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card-surface:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.card}"
    padding: "22px 24px 16px"
  currency-active:
    backgroundColor: "{colors.navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.chip}"
    height: "32px"
  theme-toggle:
    backgroundColor: "{colors.bg-light}"
    textColor: "{colors.text-secondary-light}"
    rounded: "11px"
    size: "44px"
---

# Design System

## Overview

Backoffice Executive Panel is a desktop-first operations dashboard for brand and platform operators. The visual world is **Deep Navy Cyan**: cool navy structure, cyan interaction accents, dense but calm control-room density. One job per executive view — date-scoped net profit and trend first; no marketing collage.

Preserve working API bindings and both light and dark themes (`data-bo-theme` / `bo_theme`). Prefer tokenized CSS variables (`--bo-*`) over hard-coded hex in page styles.

## Colors

Shared brand: navy `#123B66`, cyan `#21A6D7`, success `#12B76A`, danger `#EF3340`.

Light: bg `#F5F8FB`, surface `#FFFFFF`, border `#E2E7F0`, text `#11203A`, muted `#657187`, sidebar `#072647`.

Dark: bg/sidebar `#08131F`, surface `#102030`, border `rgba(255,255,255,.08)`, text `#F5F8FB`, muted `#8A95A8`. Prefer borders over heavy shadows in dark mode.

Chart series (when used): merchant `#1688F8`, game `#8248E9`, net `#16B45D` / cyan instrument line on this dashboard.

## Typography

System UI stack for ops density. Hierarchy via weight and color more than display faces. KPI values use tabular nums and tight tracking. Section/metric labels are small uppercase tracked captions — keep them sparse (one primary metric heading per hero).

## Layout

Shell: navy sidebar + sticky topbar + main. Executive dashboard hero is a single Net Profit card: controls (date 390px aligned to picker, currency) + metric + chart + footer stats. Mobile stacks controls; date picker anchors under the trigger. Touch targets ≥44px on coarse pointers.

## Elevation & Depth

Light: 1px border + soft navy-tinted shadow. Dark: surface lift via border, minimal/no shadow. Focus rings use cyan outline. Date picker uses a moderate elevation shadow (avoid huge diffuse AI glow).

## Shapes

Controls ~10px radius, cards 16px, currency chips 8px, nav pills 10–12px. No nested card stacks.

## Components

- **Date range**: trigger width matches picker (~390px); accessible name + `aria-expanded`.
- **Currency segment**: tokenized track (`--bo-bg`) and muted labels; active navy chip.
- **Theme toggle**: 44×44, labeled, pressed state.
- **Trend chart**: SVG with `role="img"`; hover and tap to inspect points; footer carries avg/peak summary.

## Do's and Don'ts

**Do**
- Keep light/dark parity when changing colors.
- Use `--bo-*` tokens on this page.
- Keep pages simple, fast, and report-light.
- Leave working API paths alone unless explicitly asked.

**Don't**
- Purple-on-white / indigo marketing gradients as the product identity.
- Warm cream + terracotta editorial defaults.
- Inter/Roboto/Arial as a display brand voice.
- Truncate the date range on tablet via shared 195px locks without page overrides.
- Hide core filters or KPIs on mobile.
