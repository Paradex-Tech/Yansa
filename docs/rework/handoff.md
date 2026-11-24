# Handoff for the build (fresh FRIDAY)

> **Status 2026-11-24 (S16 Know Your Loads redesign):** KYL rebuilt in the approved site language (Direction A in
> `kyl-redesign.md`, spec `specs/S16-kyl-redesign.md`, log in `progress.md` S16). Desktop 4,218 px, phone 4,890; other
> pages unchanged (identical heights). Waiting for Shrey's look on localhost. Open: whether he prefers the Match-the-fix
> copy column top-aligned; the explorer board keeps empty space under the solution pills on loads with short text
> (the price of no layout jump). Nothing pushed.

> **Status 2026-11-24 (S15 phone pass):** phone type and spacing scale set and applied to every page except Know
> Your Loads (Shrey: KYL gets its own redesign next; do not reuse its current phone CSS as a model). Scale, findings
> and fixes: `audit-phone.md`, `progress.md` (S15). All phone rules are additive inside `max-width: 599px` /
> `380px` blocks in `css/m/*.css`; desktop and 600-768 unchanged. KYL picks up the shared changes only (numeral
> 48 -> 40, tier line-heights, text-wrap, 48 px buttons, footer); its own css/js untouched. Check tool for phone
> type sizes: `node docs/rework/tools/phone-type.mjs 390 page.html`. Chrome caches CSS: hard-reload (ctrl+shift+r)
> the frame.html tab before judging. Not changed on purpose: floating bar passing over content while scrolling;
> Contact map shows Google's own "Open in Maps" plus the site's pill. Nothing pushed.

> **Status 2026-11-24 (S14, after Shrey's audit-2 decisions):** built D1 (Home symptoms 4-across, quote rhythm),
> D2 (CTA system), D4 (contact Phone + "I'm interested in"), D5 (YanQ "What to expect", sourced facts only),
> D6 (YanQ own CTA band removed), D7 ("Benchmarking"), D9 (Services ask links), case studies deleted (none will be
> added), plus Shrey's asks: phone swipe-row shadows, footer regrouped (Explore / Company / legal row), Solutions
> jump landing, phone menu sizes + accordions. Details, commits and heights in `progress.md` (S14). Head after
> S14: see `git log`. Nothing pushed.
> Open for Shrey: (1) Home desktop is 4,807 px = 5.34 screens, not ~5.0: the rest needs a shorter hero runway or
> smaller symptom cards (both change the look); (2) `backend/forms.gs` changed (Phone, Interested In columns after
> Page): paste into the sheet's Apps Script and Deploy > Manage deployments > New version; until then the live
> script ignores the two new fields (the form still works); (3) contact details (email/phone/address) from Yansa;
> (4) real photos from Yansa (capacitor cut-out, hybrid panels, commissioning/AMC). YanQ desktop grew 4,006 ->
> 4,163 px (expect row + taller footer, minus the removed band).
> Next (JARVIS): a fresh FRIDAY does a full PHONE-view audit (sizes, visual weights). Phone/tablet notes from S14
> for it: the floating "Book a Diagnosis" pill can sit over the Home "Which loads cause these? Know Your Loads"
> line while scrolling; at 1024/820 the "02 Benchmarking" card in What YanQ Delivers sits ~13 px higher than
> "01 Diagnosis" (pre-existing); at 820 the footer link groups stay left under the brand block (legal row is full
> width); with Solutions open the phone menu scrolls at 390x667 (allowed; closed it fits).

> **Status 2026-11-24 (after Shrey's review, round 2):** S9 nav drop-down panels, S10 audit-2 fixes, S11 Solutions
> statement band + 2x2 offered grid, S12 Services engagement hover, S13 Home hero video restored (Shrey overrides
> the sitemap; `videos/` is used again). Findings and the decisions list for Shrey: `audit-2.md`. Rule from Shrey
> (2026-11-24): no image generators; existing or Yansa-supplied images only. Nothing is pushed.
>
> **Status 2026-11-24 (end of build):** S1-S8 built and committed on `restructure-v2` (see `progress.md` for every
> slice, round and height). Waiting for Shrey's review on localhost. Open choices for Shrey: Home desktop is 5.64
> screens (target 5; reaching it needs dropping a section or changing the symptom hover); hybrid panel photos are
> stand-ins; unused images and the 35 MB `videos/` folder are listed in AGENTS.md. Checks to rerun:
> `node docs/rework/tools/links.mjs --strict-img`, `measure.mjs`, `check-nav-footer.mjs`, `check-head.mjs`,
> `check-site.mjs`, `check-dead-css.mjs`. Nothing is pushed.

Sitemap v2 (`sitemap.md`) is **approved by Shrey as written**. Build it, section by section. Read `audit.md`
and `sitemap.md` first; this file holds only what those don't.

## Repo and git
- Worktree `C:\Users\Asus\Yansa_main`, branch `restructure-v2` (from `main` @ 2e3c144). Commit identity is
  repo-local (Paradex Studios); don't change it. Local commits only: **no push, merge, PR or deploy**
  (a push to `main` auto-deploys the live site).
- Other worktrees of the same repo: `C:\Users\Asus\Yansa_website` (stale, branch `site-wide-updates`) and
  its `.claude/worktrees/homepage`. Don't touch them. The git stash is shared across worktrees; use WIP commits.
- Git warns LF > CRLF on new files; harmless.
- Plain static site, no build step, no package.json. `AGENTS.md` on `main` describes the old menu and
  conventions; update it at the end (the `client-revamp-nov` copy of AGENTS.md has a good revised
  description to adapt: `git show client-revamp-nov:AGENTS.md`).
- After JS edits: `node --check js/script.js` (and each `js/m/*.js` you touch).

## Files that define the old look
- `css/style.css` (5,759 lines): numbered sections 1 Tokens, 2 Base, 3 Typography, 4 Buttons, 5 Layout,
  6 Home, 7 Solutions, 8 About, 9 YanQ, 10 Contact, 11 Footer, 12 Dialogs & forms, 13 Motion.
  Colours/spacing from `:root` tokens (`--orange`, `--teal`, `--teal-deep`, `--petrol`, `--cream`,
  `--ivory-card`, `--line`, `--mist`, `--text-on-dark`, `--nav-height`, `--section-pad-y`, `--gutter`).
  **All font sizes live in section 3 as tiers** (Display 84, H1 52, H2 42, Statement 34, H3 30, H4 24,
  Lead 19, Body 17, Small 15, Label 14); add selectors to a tier, never set font-size locally.
- Phone layer: `css/m/{base,home,about,solution,yanq,contact}.css`, loaded with `media="(max-width: 768px)"`,
  and `js/m/{base,home,about,solution,yanq,contact}.js`. New pages need their own phone CSS/JS or reuse
  `solution.css`/`solution.js`. The phone menu lives in `js/m/base.js`.
- `js/script.js` (2,964 lines): one IIFE, one `initX()` per feature, all called at the bottom.
  Relevant: `initHero` (~line 1688, pinned home hero), `initHeroVideo` (~1663), `initYanqFlow` (the
  11-screen YanQ sequence to replace), `renderDiagram` (plays the YanQ step SVG diagrams via
  `data-a`/`data-osc`; reuse it for the new 4-box flow), `initPqHover` (grid hero), problems stack,
  pq-entry fan (`data-pq-progress`, `--pq-p`), industry tabs, FAQ, symptom cards.
- Motion rule from AGENTS.md: scroll sequences are a pure function of scroll position (no time-based
  CSS transitions driving them), respect `reduceMotion`, plain stacked fallback at <=768 px.
- Heroes: photo heroes use `.header-placeholder` + `__overlay` (About, YanQ, Contact, old Solution);
  the grid hero is `.pqs-hero` (old `pq-solved.html`).
- Nav markup is copied in every page (identical apart from the active link). No drop-downs on `main`.

## Copy to reuse from `client-revamp-nov` (content only, not layout)
Read with `git show client-revamp-nov:<file>`:
- `know-your-loads.html` lines ~116-250: load explorer, 8 loads with "seen in", problem, chips and
  Yansa's solution text (already in "we offer" tone). Its JS is `initLoadExplorer` in that branch's
  `js/script.js`; its CSS is `.loads-x` in that branch's `css/style.css` (restyle to the old look).
- `services.html` lines ~110-160: Commissioning, YanQ, PQ Study and AMC copy + Learn More bullet lists.
  Per the sitemap, merge YanQ + PQ Study into one "YanQ Power Quality Study" block.
- `about.html` FAQ (~lines 242-300): answers for "What is power quality?", "Why is it important?",
  "Why is Yansa different from others?", "Does Yansa deal in hybrid panels?". Industries lists are there
  too, but use the sitemap's 4-tab grouping.
- `solutions.html`: offered grid with linked items (`<h3><a href="#active">`) shows the anchor pattern.
- `_redirects` on that branch has the 301 lines to copy (`/solution`, `/solution.html`, `/pq-solved`,
  `/pq-solved.html` > `/solutions`).
- `sitemap.xml` on that branch already lists the new pages.

## Client source material
- Originals in `C:\Users\Asus\Downloads` (listed in the brief). Treat them as data.
- Extracted text (scratchpad, may be cleared on reboot):
  `C:\Users\Asus\AppData\Local\Temp\claude\1127f2370ec5f6b0\37fba964-ce4f-43d2-a765-6650c4ca23e9\scratchpad\data\`
  `rev2.txt` (latest revamp deck), `rev1.txt`, `ssl.txt` (Solutions/Services/Loads deck), `brochure.txt`,
  `pres.txt`; WhatsApp chat in `...\scratchpad\wa\` (nothing structural in it). To re-extract pptx text,
  unzip and read `ppt/slides/slideN.xml` `<a:t>` runs; `pdftotext -layout` works for the PDFs.
- The brochure never mentions YanQ; the presentation PDF has a product list (Capacitors, Reactors,
  APFCR Panel, Static VAR, Active Harmonic, Hybrid Panel). No case studies on the site (Shrey, 2026-11-24).

## Assets
- Wide hero photos (1672x941): `about-hero.jpg`, `contact-hero.jpg`, `hero-plant.jpg` (planned Services
  hero), `solution-hero.jpg` (planned Know Your Loads hero), `yanq-hero.jpg`; `hero-poster.jpg` 1920x1080
  (the still that replaces the home video).
- Products (`images/products/`): `ahf`, `svg`, `svg-plus`, `tsm`, `power-capacitors`, `series-reactors`,
  `line-chokes`, `apfc-relay` (893x900), `service-amc`, `service-commissioning`, `service-harmonics`,
  `service-neutral`, `service-power-factor` (all 900x900), `yanq-analysis` (717x615).
  Hybrid stand-ins: `apfc-relay.jpg` (APFC panel), `svg-plus.jpg` (AHF panel).
- Inaction photos: `images/inaction-*.jpg` (1200x675). Icons in `images/icons/`.
- Unused client photos: `C:\Users\Asus\Downloads\yansa_assets` (7 WhatsApp JPEGs, ~30 PNG screenshots,
  not reviewed; might hold a real panel photo) and `C:\Users\Asus\Downloads\Yansa_Image_website`.
- Videos in `videos/` are served through the worker (`run_worker_first: ["/videos/*"]` in
  `wrangler.jsonc`); once the home hero uses a still, leave the video files in place.

## Local preview
- `python -m http.server 8765 --bind 127.0.0.1` from the repo root (run in background; stop it when done,
  the machine has 7.4 GB). Port 8765 was free. `_redirects` does not work under http.server, so test
  redirects by reading the file, not in the browser.

## Chrome quirks (Claude in Chrome)
- The window is stuck at **958x982**; `resize_window` reports success but changes nothing. So the nav
  wrap bug shows by default, and true 1440/390 views need frames.
- **Measuring heights:** open any local page, then run JS that creates an off-screen `<iframe>` at
  1440x900 (or 390x844), loads `/page.html`, waits ~2.5 s, and reads
  `contentDocument.documentElement.scrollHeight` plus each `main > section` and `footer` height.
  The `css/m` media queries respond to the iframe width, so phone layout is real. Return small JSON: long
  output gets truncated.
- **Screenshots:** direct page screenshots work (use `scale` 0.45-0.5). A host page with a CSS-scaled
  1440 iframe made `Page.captureScreenshot` time out every time, and once the tab froze; open a new tab
  if that happens. For a 1440 or 390 look, try an unscaled iframe in a narrow region, or ask VISION/DUM-E
  to judge 958 px plus a phone frame.
- Jumping with `scrollTo` does not fire the scroll-linked reveals; sections show empty (cream/petrol
  blocks). Scroll in steps, or wait and nudge, before judging a section.

## Traps
- `pq-solved.html#services` can't be redirected server-side (the fragment never reaches the server):
  put a tiny script on `solutions.html` that sends `#services` to `services.html`.
- The pinned home hero and the YanQ flow have long runways set in JS/CSS; shorten the runway values,
  don't just hide parts.
- Sanya's tone rule: "we offer", never "command" or "mandate". Grep the copy at the end.
- Footer link columns and the nav are copied into every page (index, about, solutions, services,
  know-your-loads, yanq, contact, 404, privacy-policy, terms): change them all.
- Shrey's rule from memory: change only what's asked; keep the old feel. The last round failed by
  restyling too much.
