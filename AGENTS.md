# Git workflow rules

These apply to every agent and every human working in this repository. They exist because
a single push from a stale working copy silently deleted a large amount of merged work
(see `DESIGN.md` → Merchant Detail, and commit `f76f208`).

## Always pull before you push

Fetch and integrate before pushing. Never push a branch that is behind or diverged from
its remote.

```sh
git fetch origin
git rebase origin/main      # on your own branch
```

If the fetch brings in commits you did not have, integrate them first. `main` is protected
by a repository ruleset, so a direct push to it will be rejected — do not try to work
around that.

## Never commit a whole stale tree

Before committing or pushing, look at what your commit would remove:

```sh
git diff --stat origin/main..HEAD
```

If files you did not deliberately change show up as **deleted**, stop. Your working copy is
stale and committing it will revert other people's work. Do not run `git add -A` on a copy
you have not just fetched.

## Never touch someone else's work

Do not delete, rename, force-push, or rewrite another person's branch or commits. If a push
of yours would remove files you never edited, that is a bug in your working copy, not a
cleanup opportunity.

## Work on your own branch, land through a pull request

Commit to a personal branch (e.g. `kunzzit01/dev`) and merge through a PR. `main` requires
a pull request; bypassing the ruleset is disabled.

## The server is a deploy target, not a workstation

Do not edit or commit code on the server. Deploy with:

```sh
git fetch origin && git merge --ff-only origin/main
```

`--ff-only` refuses to invent a merge commit and **fails loudly** if the server has diverged
or has local changes — which is the point. A plain `git pull` on a dirty or diverged server
copy hides exactly the problem this rule exists to catch.

## The guard hook

`scripts/git-hooks/pre-commit` blocks a commit that deletes files still present on
`origin/main` — the exact shape of the `f76f208` incident. Install it in your clone:

```sh
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Hooks are per-clone and are not transferred by git, so install it after every fresh clone.

A `pre-push` hook for "is my branch behind?" is **not** needed: git already refuses a
non-fast-forward push locally and never invokes the hook for it. Verified empirically. The
hole that mattered was a stale *working tree* producing a valid fast-forward, which is what
the pre-commit guard covers.

## Verify before you claim

After deploying or migrating, confirm the result rather than assuming: check the file that
should now exist, or the value that should now be applied.
