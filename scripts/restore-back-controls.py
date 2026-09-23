"""Re-apply the back-control moves (lost to a `git reset --hard origin/main`).

Owner: 查看其他页面的back按键统一在右边 — the control becomes the last child of a row that is
`space-between` or carries an auto margin, which is where the house sheets already put theirs
(`.mac-back-section`, `.vle-back-list`). Idempotent: each move is a no-op if already applied.
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root (this file lives in scripts/)
def read(p): return io.open(os.path.join(ROOT, p), encoding="utf-8", errors="replace").read()
def write(p, s): io.open(os.path.join(ROOT, p), "w", encoding="utf-8", newline="").write(s)

def take(s, anchor_id):
    at = s.index(anchor_id)
    start = s.rindex("<", 0, at)
    tag = "button" if s[start:start + 7].lower().startswith("<button") else "a"
    depth = 0
    i = start
    while True:
        nxt = re.search(r"<%s\b|</%s\s*>" % (tag, tag), s[i:])
        if not nxt: raise SystemExit("unterminated element for " + anchor_id)
        j = i + nxt.start()
        if s[j:j + 2] == "</":
            depth -= 1
            if depth == 0:
                end = s.index(">", j) + 1
                return s[start:end], s[:start] + s[end:]
            i = j + 2
        else:
            depth += 1
            i = j + 1

edits = []

# 1. Agent Performance Detail — the page in the owner's screenshot. Row = [back][name][breakdown
#    toggle]; the toggle carries `margin-left:auto`, so the back control last puts it at the right edge.
p = "agent-performance-detail.html"; s = read(p)
if s.index('id="detailBack"') < s.index('id="detailOpsToggle"'):
    block, s = take(s, 'id="detailBack"')
    row_end = s.index("</div>", s.index('id="detailOpsToggle"'))
    s = s[:row_end] + block + s[row_end:]
    write(p, s); edits.append((p, "back -> last child of .perf-detail-top"))

# 2. Agent Details — the row is `justify-content-between` = [heading][tab strip]; the back control goes
#    AFTER the tab strip (not inside it: a button in a `role=tablist` is announced as a tab and inherits
#    the strip's chrome — measured background rgba(0,0,0,0), no border, tab padding).
p = "agent-detail.html"; s = read(p)
if s.index('id="backAgentList"') < s.index('class="agent-detail-tabs"'):
    block, s = take(s, 'id="backAgentList"')
    tabs_close = s.index("</div>", s.index('class="agent-detail-tabs"')) + len("</div>")
    s = s[:tabs_close] + " " + block + s[tabs_close:]
    s = re.sub(r'<div>\s*<span class="ms-2 fw-bold"', '<div><span class="fw-bold"', s, count=1)
    write(p, s); edits.append((p, "back -> after the tab strip"))

# 3. Agent Provider Detail — `.user-toolbar` is `space-between` but held one child, so back+title+range
#    stacked at the left; split it into [title block][back].
p = "agent-provider-detail.html"; s = read(p)
if 'user-toolbar mb-3"><div><button' in s:
    block, s = take(s, 'id="agentProviderBackBtn"')
    block = block.replace("clean-btn mb-3", "clean-btn")
    anchor = '<small id="agentProviderRange" class="text-muted"></small></div>'
    s = s.replace(anchor, anchor + block, 1)
    write(p, s); edits.append((p, "back -> second child of .user-toolbar"))

# 4. Balance Adjustment — the link was a block of its own above the heading; `.main-mod-head` is
#    `space-between`, so it moves onto the heading row at the right.
p = "main-balance-adjustment.html"; s = read(p)
head = s.index('<div class="main-mod-head">')
row_start = s.index("</div>", s.index("</p>", head)) + len("</div>")
if s.index('class="main-mod-back"') < head:
    block, s = take(s, 'class="main-mod-back"')
    s = s[:row_start] + " " + block + s[row_start:]
    write(p, s); edits.append((p, "back -> heading row"))

# 5. Main Stat Detail — last in a `flex-start` filter row (mid-row). A plain `#detailBack` rule loses to
#    the standard sheet's `body:not(#…):not(#…) .report-main .bo-filter-row > *` margin reset, which is
#    ID-level, so the rule has to sit at that same tier.
p = "main-stat-detail.html"; s = read(p)
rule = ("/* The back control sits last in a flex-start filter row, i.e. mid-row. Pinning it right needs the\n"
        "   same specificity tier the standard sheet uses: its \"body:not(#a):not(#b) .report-main\n"
        "   .bo-filter-row > *\" guard is ID-level, so a plain \"#detailBack\" rule loses to it regardless of\n"
        "   source order. */\n"
        "body:not(#bo-filter-standard-off):not(#bo-filter-standard-legacy) .report-main .detail-filter-card "
        ".bo-filter-row>#detailBack{margin:0 0 0 auto!important;flex:0 0 auto!important}\n")
if "bo-filter-row>#detailBack" not in s:
    s = s.replace("<style>", "<style>\n" + rule, 1)
    write(p, s); edits.append((p, "back pinned right inside the filter row"))

for p, what in edits:
    print("OK  %-34s %s" % (p, what))
if not edits:
    print("all five already in place")
