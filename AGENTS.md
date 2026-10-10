# Yansa website — agent handoff

Context for any coding agent (Codex, Claude Code, …) picking up this project.
Last updated 2026-09-27.

## What this is
Marketing site for **Yansa**, a power quality engineering company (harmonics,
power factor, IEEE 519-2022 studies). Built by **Paradex Studios** for the
client contact at Yansa, Sanya.

**Plain static site: HTML + one CSS file + vanilla JS. No React, no build step,
no package.json.** Don't introduce a framework or bundler.

- Pages: `index.html` (Home), `solution.html`, `about.html`, `yanq.html`,
  `contact.html`, `404.html`
- `css/style.css`: the only stylesheet (see Conventions)
- `js/script.js`: one IIFE; each feature is an `initX()` function, all called
  at the bottom of the file
- `backend/forms.gs`: Google Apps Script form backend (copy for version
  control; the live copy lives in the Google Sheet)
- `assets/yansa-brochure.pdf`, `images/`, `images/icons/`, `fonts/` (woff2),
  `videos/`
- SEO files: `sitemap.xml`, `robots.txt`, `site.webmanifest`, favicons,
  `images/og-image.jpg`

### Run locally
```
python -m http.server 8000     # from this folder
```
Then open http://localhost:8000/index.html and hard-refresh (Ctrl+Shift+R)
after CSS/JS changes.

## Conventions (follow them)
- **Stylesheet** is organised in numbered sections: 1 Tokens, 2 Base,
  3 Typography, 4 Buttons, 5 Layout, 6 Home, 7 Solutions, 8 About, 9 YanQ,
  10 Contact, 11 Footer, 12 Dialogs & forms, 13 Motion. Put new rules in the
  right section.
- **Colours and spacing come from `:root` tokens** (`--orange`, `--teal`,
  `--teal-deep`, `--petrol`, `--cream`, `--ivory-card`, `--line`, `--mist`,
  `--text-on-dark`, `--nav-height`, `--section-pad-y`, `--gutter`, …). Don't
  hard-code new hex values.
- **Every font-size lives in section 3 (Typography)** as tiers (Display 84 ·
  H1 52 · H2 42 · Statement 34 · H3 30 · H4 24 · Lead 19 · Body 17 · Small 15
  · Label 14) with responsive overrides. To size something, add its selector
  to a tier; never set font-size locally.
- **Motion is scroll-linked, never time-based**, for scroll sequences: a pure
  function of scroll position, so it stops when scrolling stops and reverses
  on scroll up. No CSS transitions/keyframes driving those sequences. Respect
  `prefers-reduced-motion` (the global `reduceMotion` flag in script.js) and
  the ≤768px stacked fallbacks.
- Match the existing comment style (short block comments explaining *why*).
- Run `node --check js/script.js` after JS edits.

## Git / GitHub
- Repo: https://github.com/Paradex-Tech/Yansa (owned by the personal account
  **Paradex-Tech**; **paradexstudios** is a collaborator with write access
  and does the pushing).
- Repo-local commit identity: `Paradex Studios <paradexstudios@gmail.com>`.
- Branches: `main` (final), `dev` (working), `site-wide-updates` (feature
  work), `seo` (stale, can be deleted). `main`, `dev` and
  `site-wide-updates` were all at `5c1d16d` at handoff.
- **Hosting: Cloudflare Pages** (being connected to the repo; no build
  command, output directory = repo root). Config lives in `_headers`
  (security + cache headers) and `_redirects` (sends AGENTS.md, backend/
  and the config files themselves to /404). Pages serves `/about.html` as
  `/about`, so absolute URLs (canonical, og:url, sitemap) are extensionless;
  relative links keep `.html` so the local python server still works.
  Once connected, a push to `main` deploys.
- **Never push without the user's explicit OK.**
- `.claude/` is gitignored; `.claude/worktrees/homepage` is a stale worktree
  (branch `worktree-homepage`). Don't merge it. Delete it only if the user
  agrees.

## Uncommitted at handoff (the user is reviewing on localhost)
1. **Home hero video** (replaced 2026-09-27 with `YANSA_HERO_VIDEO.mp4`):
   `videos/hero-1920.mp4` (25.8 MB, for ≥1400px) is the user's file
   remuxed only (no re-encode: the user found compressed cuts too soft), and
   `videos/hero-1280.mp4` (10.8 MB) is a CRF 19 encode. No audio track.
   Cloudflare Pages caps a file at 25 MiB; hero-1920 is just under, so a
   longer or higher-bitrate replacement will need a light re-encode. The poster is `images/hero-poster.jpg` (first frame).
   The `<video>` in `index.html` replaced the `<img>` inside `.hero__media`.
   `initHeroVideo()` holds it on the poster under reduced motion.
2. **Hero overlay removed completely** at the user's request (the
   `.hero__media-scrim` element, its CSS, and its JS fade). Open question:
   whether the white "REFINING POWER" heading and tagline stay readable over
   the bright interior shots. If not, suggest a soft text-shadow rather than
   bringing the overlay back.

Commit these once the user confirms they look right.

## Forms backend (Google Sheet + Apps Script)
- Sheet "Yansa Website — Form Submissions" (paradexstudios Drive, folder
  "Yansa Assets"):
  https://docs.google.com/spreadsheets/d/1wDh7HBbQCDd6F639c01GRsWW4RpvoSir5ac-K3ro6YI/edit
  It has two tabs, Contact and Brochure. 4 rows labelled "TEST - Claude" can
  be deleted.
- Web app URL (in `js/script.js` as `FORMS_ENDPOINT`):
  https://script.google.com/macros/s/AKfycby1FseYxoZf98idb1vlxApBTynyOCM12i5B3SKHmHeEEYV1xkUWQpcnin7PoLonbN95UA/exec
- The front end posts form-encoded (no CORS preflight). There's a honeypot
  field `website`, and a guard against formula injection in the sheet.
- The brochure popup (every `a[data-brochure]`) saves the lead, then
  downloads `assets/yansa-brochure.pdf`.
- **Pending: the user must redeploy the Apps Script** with the updated
  `backend/forms.gs` (Deploy → Manage deployments → edit → New version, then
  re-authorise). Until then, no emails go out. Once redeployed:
  - it emails the requester the brochure, fetched from
    `raw.githubusercontent.com/Paradex-Tech/Yansa/main/assets/yansa-brochure.pdf`;
  - it sends an alert for every submission to `NOTIFY_TO`
    (paradexstudios@gmail.com).

## YanQ page (`yanq.html`), the most complex part
- The intro matches the Home "Diagnosis" section's type and spacing.
- **`.yanq-flow`: one pinned, scroll-linked sequence (`initYanqFlow`).**
  1. The heading "How YanQ Works." locks while the statement reads along.
  2. The background eases from cream to petrol.
  3. The 4 steps scroll as a list with faded edges, and each step holds at
     the focus line (the stage's vertical centre) while its diagram builds in
     a fixed box on the right.
  4. A dashed wave (`images/icons/yanq-wave-tile.svg`, repeated as a mask) is
     the progress rail, with an orange marker locked mid-screen.
  5. Outro: "YanQ" stays fixed while How/Works swap to What/Delivers, and the
     real `.yanq-delivers` section rises into place (a seamless release).
- Tuning knobs, near the top of `initYanqFlow`: `STEP = 2.4` (stage heights
  of scroll per step), `HOLD = 0.45` (share of a step spent parked),
  `BUILD_AT = 0.75`, `OUT = 1`, `CLEAR = 24`.
- Step diagrams: 4 inline SVGs in `.yanq-anim[data-step=1..4]`, driven by a
  port of the user's `process-diagrams.js` (`prepareDiagram`,
  `renderDiagram`, `resetDiagram`). They're recoloured through the classes
  `yd-clean` (teal), `yd-raw` (orange), `yd-guide` (mist) and `yd-surface`.
  Hooks available to SVGs: `--flow-progress`, `--flow-step` and
  `--step-progress` (0.25–0.75 = parked at focus), plus `.is-active`.
- **What YanQ Delivers**: 2×2 icon cards
  (`images/icons/yanq-deliver-*.svg`) with numbers, teal bars and row
  dividers. The heading intentionally hangs 16px left of the grid; the user
  chose to leave it.
- The user supplies animations and copy. **Don't invent animations or
  client copy**; leave labelled slots instead.

## Other site notes
- The navbar is always visible (auto-hide was removed site-wide). A cyan
  sliding underline follows hover and focus (`initNavIndicator`).
- Solution page: the Problems section is content-height (not pinned); its
  cards deal by scroll.
- Home: the Case Studies section and its footer links are `hidden` until real
  case studies exist.

## Open items / waiting on the user
1. Redeploy the Apps Script (see Forms backend above).
2. Add Sanya as a GitHub collaborator. It has to be done from the
   **Paradex-Tech** owner account, and Sanya's GitHub username is still
   unknown.
3. New **"Why Yansa"** copy for `index.html` (the section `.why`: the
   "Data Before Direction" / "System Level Thinking" / "We Stay Until It's
   Solved" cards are old copy). Wait for the user's text.
4. Connect Cloudflare Pages and add the yansa.in domain.
5. Optionally delete the stale worktree and the `seo` branch.

## Working with this user
- Uses Hinglish casually; keep replies short and clear.
- Checks visual results on localhost themselves. Don't spend effort on
  browser screenshots or measurement unless asked.
- Don't undo a style or design choice the user explicitly asked for.
- Commit when asked; push only with an explicit OK.
