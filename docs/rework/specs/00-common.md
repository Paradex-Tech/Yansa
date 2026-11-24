# Common rules for every build slice (read before any spec)

Project: Yansa marketing site, plain static HTML/CSS/JS, no build step, no npm deps. Repo/worktree
`C:\Users\Asus\Yansa_main`, branch `restructure-v2`. The approved plan is `docs/rework/sitemap.md` (build it exactly).
Read `docs/rework/handoff.md` (files, tokens, quirks, traps) and `docs/rework/audit.md` before your first edit.

## Identity of the site (do not change)
- The old site (`main` @ 2e3c144) look is "absolutely perfect" per the client: keep its fonts, colours, spacing,
  photo heroes, section styles and scroll-linked motion. Raise craft, never restyle. Change only what the spec asks.
- Colours/spacing only from `:root` tokens in `css/style.css` section 1. All font sizes live in section 3 tiers
  (Display 84, H1 52, H2 42, Statement 34, H3 30, H4 24, Lead 19, Body 17, Small 15, Label 14): add selectors to a
  tier, never set font-size locally. Keep existing font weights.
- Phone layer: `css/m/*.css` loaded with `media="(max-width: 768px)"` and `js/m/*.js`. New pages get their own
  phone file or reuse an existing one, and must be fully designed at 390 px, not just stacked.
- `js/script.js`: one IIFE, one `initX()` per feature, called at the bottom. `node --check` every JS file you touch.

## Motion rules
- Scroll sequences are a pure function of scroll position (no time-based transitions driving them). In-view reveals
  may use IntersectionObserver + CSS transitions (transform/opacity only).
- Honour `prefers-reduced-motion` (show the final state, no movement). No layout shift: reserve space for anything
  that animates in; images get width/height attributes.
- No new libraries. Animate transform/opacity/stroke-dashoffset only; no animating width/height/top/left.

## Copy rules
- Tone: "we offer", collaborative. Never "command", "mandate". Reuse copy named in the handoff/spec; read old copy
  with `git show main:<file>` and Sanya's copy with `git show client-revamp-nov:<file>` (content only, not layout).

## Dev tools (built in S1, in `docs/rework/tools/`)
- Server: `python -m http.server 8765 --bind 127.0.0.1` from the repo root (check the port first; it may already be
  running; if you start it, stop it before hand-back unless the spec says leave it).
- `node docs/rework/tools/measure.mjs [pages...]`: scroll heights (1440x900 and 390x844), section heights, console
  errors, failed requests.
- `node docs/rework/tools/shots.mjs <label> <page> [--w 1440,390] [--sel "#id"]`: screenshots into the scratchpad.
- `node docs/rework/tools/links.mjs`: internal links, anchors, images, retired URLs.
- One headless Chrome at a time (7.4 GB machine). Close it when done.

## Hard limits
- Local commits on `restructure-v2` only, repo-local identity (do not change git config). NO push, merge, PR, deploy.
- Never touch `C:\Users\Asus\Yansa_website` or other worktrees. No git worktrees, no stash (use WIP commits).
- Do not edit `docs/rework/sitemap.md` or any file in `docs/rework/specs/`.
- Commit after each finished area. Every commit message ends with exactly:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- Stop every background process, Monitor and headless Chrome you started before hand-back.
- Do not run one silent command longer than ~8 minutes.

## Hand-back (short)
What you built, commit SHAs, measured heights (desktop/phone screens) for the pages you touched, check-script
results, screenshot folder path, anything you could not do or decided yourself. No long code recaps.
