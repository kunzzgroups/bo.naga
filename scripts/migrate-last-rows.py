"""Migrate the last two families onto the locked listing tier (36px / 8px radius, pad 0 12px, 12px type).

DESIGN.md line 349 schedules this: the legacy 42px rows "may still show legacy heights until those
pages are migrated - then bring them to 36px". Measured before writing:

  .mp-toolbar      (menu-permission, main-merchant-roles)      row 64: mp-search 42, actions 32
  .mrc-filter-row  (both *-role-create pages)                  row 42: mp-search 42, tools 34
  .bo-filter-row   (game, game-category)                       row 103/100: EVERY child 42 (search,
                                                                 selects, action buttons) - uniform
  .user-search-grid (admin-user)                               row 64: fields 62 (controls 42)
  .livechat-search (livechat)                                  vertical stack: card head 36, search 42

The row moves WHOLE wherever the row is uniform (the search alone would sit 6px shorter than the
select beside it), and alone where it is a vertical stack (livechat). game / game-category /
admin-user ship no page sheet of their own - they load the shared recipe - so their block goes in
reports.css, scoped by their own body class.

Idempotent.
"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = "html:not(#bo-filter-standard-off):not(#bo-charcoal-off)"
ROWS = """  height:36px!important;
  min-height:36px!important;
  max-height:36px!important;
  border-radius:8px!important;
  font-size:12px!important;
  line-height:1.2!important;
"""

BLOCKS = {
    # --- the roles / permissions family: its own shared sheet -------------------------------
    "assets/css/menu-permission-executive.css": """

/* --------------------------------------------------------------------------
   2026-09-23 - roles / permissions rows onto the LOCKED listing tier (36px / 8px, pad 0 12px,
   12px type). DESIGN.md line 349. Measured before: `.mp-toolbar` row 64 with `mp-search:42` and
   `mp-toolbar-actions:32`; `.mrc-filter-row` row 42 with `mp-search:42` and `mrc-perm-tools:34`.
   The row moves together - a 36px search beside a 42px action cluster reads as a mistake.
   -------------------------------------------------------------------------- */
%s .mp-toolbar > .mp-search,
%s .mp-toolbar .mp-toolbar-actions > *,
%s .mp-toolbar > .rounded-select-wrap,
%s .mp-toolbar > .rounded-select-wrap .rounded-select-btn,
%s .mrc-filter-row > .mp-search,
%s .mrc-filter-row > .mrc-search,
%s .mrc-filter-row .mrc-perm-tools > *,
%s .mrc-filter-row > .rounded-select-wrap .rounded-select-btn{
%s}
%s .mp-toolbar > .mp-search,
%s .mrc-filter-row > .mp-search,
%s .mrc-filter-row > .mrc-search{
  padding:0 12px!important;
}
%s .mp-toolbar .mp-search > input,
%s .mrc-filter-row .mp-search > input{
  height:100%%!important;
  min-height:0!important;
  border:0!important;
  background:transparent!important;
  font-size:12px!important;
}
""" % ((G,) * 8 + (ROWS,) + (G,) * 3 + (G,) * 2),

    # --- game / game-category / admin-user: they have no page sheet, so scope by body class ---
    "assets/css/reports.css": """

/* --------------------------------------------------------------------------
   2026-09-23 - the two landing listings that ship no sheet of their own onto the LOCKED tier.
   `game` and `game-category` (`body.standardized-game-management`) and `admin-user`
   (`body.admin-management-page`) style their filter row from this file's shared recipes, and
   measured a UNIFORMLY 42px row (every `.bo-filter-item` child 42: search, selects, actions;
   admin-user's fields 62 with 42px controls). A 36px search beside a 42px select would read as a
   mistake, so the row moves whole. Guard tier, so it beats the shared recipe below it.
   The search input keeps the border here - on these pages the input owns it and the wrapper is
   layout-only (the same split `agent-players` documents as v2.3.7).
   -------------------------------------------------------------------------- */
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .game-search-control,
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .category-search-control,
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .rounded-select-wrap,
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .rounded-select-wrap .rounded-select-btn,
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .game-filter-actions > *,
%s body.standardized-game-management .bo-filter-row > .bo-filter-item > .category-filter-actions > *,
%s body.standardized-game-management .bo-filter-row .game-search-control > input,
%s body.standardized-game-management .bo-filter-row .category-search-control > input,
%s body.admin-management-page .user-search-grid .input-icon-wrap,
%s body.admin-management-page .user-search-grid .user-search-grid,
%s body.admin-management-page .user-search-grid .rounded-select-wrap,
%s body.admin-management-page .user-search-grid .rounded-select-wrap .rounded-select-btn,
%s body.admin-management-page .user-search-grid .filter-action-row > *,
%s body.admin-management-page .user-search-grid .input-icon-wrap > input{
%s}
%s body.standardized-game-management .bo-filter-row .game-search-control,
%s body.standardized-game-management .bo-filter-row .category-search-control,
%s body.admin-management-page .user-search-grid .input-icon-wrap{
  padding:0 12px!important;
}
%s body.standardized-game-management .bo-filter-row .game-search-control > input,
%s body.standardized-game-management .bo-filter-row .category-search-control > input{
  padding:0 12px 0 34px!important;
}
""" % ((G,) * 14 + (ROWS,) + (G,) * 3 + (G,) * 2),

    # --- livechat: the search is its own row in a vertical stack -----------------------------
    "assets/css/livechat-executive.css": """

/* --------------------------------------------------------------------------
   2026-09-23 - the Live Chat inbox search onto the LOCKED tier (36px / 8px, 12px type).
   Measured: `.livechat-inbox-card` is a vertical stack - card head 36, `livechat-search` 42,
   list - so this one moves ALONE and lands flush with the 36px head above it. DESIGN.md line 349.
   -------------------------------------------------------------------------- */
%s .livechat-search,
%s .livechat-search > .rounded-select-wrap .rounded-select-btn{
  height:36px!important;
  min-height:36px!important;
  max-height:36px!important;
  border-radius:8px!important;
  font-size:12px!important;
  line-height:1.2!important;
}
%s .livechat-search{
  padding:0 12px!important;
}
%s .livechat-search > input{
  height:100%%!important;
  min-height:0!important;
  border:0!important;
  background:transparent!important;
  font-size:12px!important;
}
""" % ((G,) * 4),
}

for path, block in BLOCKS.items():
    full = os.path.join(ROOT, path)
    s = io.open(full, encoding="utf-8", errors="replace").read()
    marker = block.strip().splitlines()[0]
    if marker in s:
        print("%-44s already present" % path)
        continue
    out = s.rstrip("\n") + "\n" + block
    io.open(full, "w", encoding="utf-8", newline="").write(out)
    print("%-44s appended %d bytes | braces:%s" % (path, len(block), "ok" if out.count("{") == out.count("}") else "BROKEN"))
