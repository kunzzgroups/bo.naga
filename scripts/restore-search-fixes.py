"""Re-apply the search-bar fixes lost to a `git reset --hard origin/main`.

Three separate defects, all measured (see DESIGN.md → "Why the search bars look different
from page to page"):

1. `#bonusSearchInput` was hard-coded into the shared search recipe in `reports.css` back when
   the page used that recipe's wrapper. The field has since moved into a pill, so the id kept
   forcing `height:42px` into a 36px pill (measured +6px overshoot).
2. Two generic "every input" themes (`reports.css`, `bo-charcoal-legacy.css`) draw their own
   border/background inside any bespoke search component unless exempted — and they exempted
   fields by ENUMERATING IDS (`#providerSearchInput`, `#pullLogWindowValue`, `#boPassword`).
   They now exempt whole components instead.
3. `bo-charcoal-agent.css` swept a border onto `agent-players`' search wrapper; that page's own
   sheet (v2.3.7) wants the wrapper layout-only and the input bordered.

Idempotent: re-running changes nothing.
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root (this file lives in scripts/)
CHAIN = "".join(":not(%s input)" % w for w in
                [".mad-search", ".mp-search", ".mrc-search", ".mas-search",
                 ".mac-provider-search", ".agent-search-box",
                 ".bonus-title-search"])

def edit(path, fn):
    full = os.path.join(ROOT, path)
    s = io.open(full, encoding="utf-8", errors="replace").read()
    out, note = fn(s)
    if out != s:
        io.open(full, "w", encoding="utf-8", newline="").write(out)
    braces = out.count("{") == out.count("}")
    print("%-44s %-46s braces:%s" % (path, note, "ok" if braces else "BROKEN"))

# 1 + 2 — reports.css: drop the leaked id, exempt components from the generic input theme.
def fix_reports(s):
    n = s.count("#bonusSearchInput")
    s = re.sub(r"^#bonusSearchInput(:focus)?,\n", "", s, flags=re.M)
    def add(m):
        sel = m.group(1)
        return sel if ":not(.mad-search input)" in sel else sel + CHAIN
    s = re.sub(r"(\.report-content input(?::not\([^)]*\))*)", add, s)
    return s, "id refs %d->%d, component exemptions added" % (n, s.count("#bonusSearchInput"))

def fix_legacy(s):
    def add(m):
        sel = m.group(1)
        return sel if ":not(.mad-search input)" in sel else sel + CHAIN
    before = s.count(":not(.mad-search input)")
    s = re.sub(r"(\.report-content input(?::not\([^)]*\))*)", add, s)
    return s, "component exemptions: %d -> %d" % (before, s.count(":not(.mad-search input)"))

edit("assets/css/reports.css", fix_reports)
edit("assets/css/bo-charcoal-legacy.css", fix_legacy)

# 3a — the agent skin stops drawing the wrapper border: the page wants the input to own it.
def fix_agent(s):
    removed = []
    def kill(m):
        sel = m.group(0).split("{")[0]
        if re.search(r"agent-search-box\s*>\s*input", sel):
            removed.append(1)
            return ""
        return m.group(0)
    s = re.sub(r"[^{}]*\{[^{}]*\}", kill, s)
    def add(m):
        sel = m.group(1)
        return sel if ":not(.agent-search-box input)" in sel else sel + ":not(.agent-search-box input)"
    s, n = re.subn(r"(\.agent-player-filters input(?::not\([^)]*\))*)", add, s)
    return s, "inner-border rules removed %d, sweeps exempted %d" % (len(removed), n)

edit("assets/css/bo-charcoal-agent.css", fix_agent)

# 3c — and stop the skin drawing the WRAPPER border at all (its own rules, light + dark): the page's
# sheet (v2.3.7) wants the wrapper layout-only and the input to own the visible border.
def unwrap_agent(s):
    removed = []
    def fix(m):
        sel, body = m.group(1), m.group(2)
        if "border" not in body:
            return m.group(0)
        entries = [e.strip() for e in sel.split(",") if e.strip()]
        if not any(re.fullmatch(r".*\.agent-search-box\s*(:[\w-]+)?", e) for e in entries):
            return m.group(0)
        keep = [e for e in entries if not re.fullmatch(r".*\.agent-search-box\s*(:[\w-]+)?", e)]
        removed.append(len(entries) - len(keep))
        return "" if not keep else ",".join(keep) + "{" + body + "}"
    s2 = re.sub(r"([^{}]*)\{([^{}]*)\}", fix, s)
    return s2, "wrapper entries removed %d" % sum(removed)

edit("assets/css/bo-charcoal-agent.css", unwrap_agent)

# 3b — the locked listing tier for the MAIN-executive `.mad-filters` rows (DESIGN.md line 349).
TIER = """

/* --------------------------------------------------------------------------
   2026-09-23 — the MAIN-executive filter row moves onto the LOCKED listing tier.
   DESIGN.md line 349 schedules exactly this: the `.mad-filters` families "may still
   show legacy heights until those pages are migrated — then bring them to 36px".
   The locked recipe is the Wallet Ledger specimen: 36px tall, 8px radius, pad 0 12px,
   12px type. The row moves WHOLE — search, selects, date trigger, ghost buttons —
   because migrating the search alone would leave it 6px shorter than its neighbours.
   This sheet, not bo-charcoal-shell.css: the MAIN-executive pages never load the shell
   (measured — 14 sheets, none of them the shell); this is the skeleton they share.
   Guard tier, so it out-ranks the legacy `body.<page> .mad-search{42px}`,
   `… .rounded-select-btn{42px|44px}` and `.mad-reset-btn{44px}` declarations above.
   -------------------------------------------------------------------------- */
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .mad-search,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .rounded-select-wrap,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .rounded-select-wrap .rounded-select-btn,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .mas-date-field,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .mre-period-group,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .ref-range-wrap,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .ref-range-trigger,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .mad-btn,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .clean-btn,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .reportExport,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .mad-filter-field > select,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > select{
  height:36px!important;
  min-height:36px!important;
  max-height:36px!important;
  border-radius:8px!important;
  font-size:12px!important;
  line-height:1.2!important;
}
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .mad-search,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > select,
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .mad-filter-field > select{
  padding:0 12px!important;
}
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters > .rounded-select-wrap .rounded-select-btn{
  padding:0 34px 0 12px!important;
}
html:not(#bo-filter-standard-off):not(#bo-charcoal-off) body .mad-filters .mad-search > input{
  height:100%!important;
  min-height:0!important;
  max-height:100%!important;
  border:0!important;
  background:transparent!important;
  font-size:12px!important;
}
"""

def fix_tier(s):
    if "bo-filter-standard-off" in s:
        return s, "tier block already present"
    return s.rstrip("\n") + "\n" + TIER, "tier block appended (%d bytes)" % len(TIER)

edit("assets/css/main-admin-detail-executive.css", fix_tier)
