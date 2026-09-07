# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are operators (运营商), operations staff (运营人员), and the internal team that builds and maintains this backoffice. They work in day-to-day ops sessions where **data accuracy** and **snappy, non-blocking interactions** matter more than visual novelty.

## Product Purpose

A multi-role gaming / casino **Backoffice** (Admin / Executive Panel) for running brands: members and wallets, deposits and withdrawals, game providers, promotions and VIP, agent workflows, accounting, and operational reports.

Success means pages stay **simple and easy to operate**, feel **fast and fluid**, and keep **reports uncomplicated** while showing trustworthy numbers.

## Positioning

An operations control surface for brand and platform ops — not a marketing site. Priority is accurate data, clear workflows, and low cognitive load over feature spectacle.

## Operating Context

- Desktop-first web admin with light/dark theme (`bo_theme` / `data-bo-theme`).
- Shared shell: sidebar navigation, top bar, report/dashboard layouts across many static HTML pages.
- Roles span Main / Root admin, merchant admin, and agent surfaces.
- Typical jobs: scan KPIs by date range, manage members/funds, configure games and promos, review reports and settlements.

## Capabilities and Constraints

- **Must preserve working API connections** — do not casually change endpoints, payloads, auth, or data-binding that already works.
- **Must keep light mode and dark mode** as first-class themes.
- Prefer simple pages and uncomplicated reports; avoid adding operational complexity for its own sake.
- Performance: UI should not feel laggy during normal ops (filters, tables, modals, date ranges).
- Stack is an existing static HTML + Bootstrap 5 + shared CSS/JS asset library (not a greenfield framework choice).

## Brand Commitments

- Product naming in UI: **Backoffice** (Admin Panel / Executive Panel).
- Existing theme direction documented under `.interface-design/` (Deep Navy Cyan) is incumbent identity for refinement work unless the user explicitly requests a redesign.

## Evidence on Hand

- Large set of page HTML files at project root (dashboards, members, reports, agent/merchant/main flows).
- Shared styles and scripts under `assets/`.
- Internal design notes in `.interface-design/system.md` and related docs.
- No fabricated testimonials, pricing, or customer claims — do not invent them.

## Product Principles

1. **Accuracy first** — numbers and ops actions must stay correct; never sacrifice data integrity for polish.
2. **Simple to operate** — clear layouts, low friction, reports that stay easy to read.
3. **Fluid performance** — interactions should feel responsive; avoid heavy UI that slows operators.
4. **Preserve what works** — keep light/dark modes and existing API wiring unless change is explicitly requested.
5. **Ops over ornament** — design serves operators completing tasks, not decorative demos.

## Accessibility & Inclusion

No product-specific WCAG mandate was set beyond general usability for daily ops. Light/dark mode support is a confirmed requirement.
