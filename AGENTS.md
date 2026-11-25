# Yansa website — agent handoff

Context for any coding agent (Codex, Claude Code, …) picking up this project.
Last updated 2026-11-24 (rework branch `restructure-v2`, slice S8 final pass).

## What this is
Marketing site for **Yansa**, a power quality engineering company (harmonics,
power factor, IEEE 519-2022 studies). Built by **Paradex Studios** for the
client contact at Yansa, Sanya.

**Plain static site: HTML + one CSS file + vanilla JS. No React, no build step,
no package.json.** Don't introduce a framework or bundler.

## Pages
`index.html` (Home), `about.html`, `solutions.html`, `services.html`,
`know-your-loads.html`, `yanq.html`, `contact.html`, `privacy-policy.html`,
`terms.html`, `404.html`. `solution.html` and `pq-solved.html` are retired:
`_redirects` sends `/solution(.html)` and `/pq-solved(.html)` to `/solutions` (301),
and a small script on `solutions.html` forwards `#services` to `services.html`.

- **Menu (6 items + CTA)**: Home · About Us · Solutions · Services · Know Your
  Loads · Contact, plus the orange "Book a Diagnosis" button. Solutions has a
  drop-down (Active / Passive / Hybrid), Services has one (YanQ Power Quality
  Study / Commissioning Support / AMC). Markup: `.nav-item` > `.nav-item__link`
  + `.nav-item__chev` button + `.nav-menu`; behaviour in `initNavMenus` and
  `initNavIndicator` (script.js). The YanQ page shows **Services** as active.
  The nav block and the footer link columns are copied into every page and must
  stay identical apart from the active link (`check-nav-footer.mjs` enforces it;
  404 uses root-absolute hrefs and has no CTA block). The phone menu (full
  screen, sub-links listed) is built in `js/m/base.js`.
- `css/style.css`: the only desktop stylesheet (see Conventions).
- `js/script.js`: one IIFE; each feature is an `initX()` function, all called
  at the bottom of the file.
- `backend/forms.gs`: Google Apps Script form backend (copy for version
  control; the live copy lives in the Google Sheet).
- `assets/yansa-brochure.pdf`, `images/`, `images/icons/`, `fonts/` (woff2).
- SEO files: `sitemap.xml` (the nine public pages, extensionless absolute
  URLs), `robots.txt`, `site.webmanifest`, favicons, `images/og-image.jpg`.
  Every page has a unique title/description, canonical + og:url, og:image and
  valid JSON-LD (`check-head.mjs`).
- `videos/hero-1920.mp4`, `hero-1280.mp4` (18 MB, new 25 s film from 25 Nov) are the Home hero film
  (`<video>` in `index.html`, poster `images/hero-poster.jpg`, 1920 cut from 1400 px;
  paused on the poster under reduced motion by `initHeroVideo`); `worker/index.js` routes `/videos/*`.

### Run locally
```
python -m http.server 8765 --bind 127.0.0.1     # from this folder
```
Then open http://127.0.0.1:8765/index.html and hard-refresh (Ctrl+Shift+R)
after CSS/JS changes (http.server lets Chrome cache old CSS).

## Page notes (what is where)
- **Home**: pinned hero with the shrink-to-card move over the hero film
  (poster `images/hero-poster.jpg`), "We Measure
  What Others Miss." card, Diagnosis, Symptoms (four line drawings that play in
  view and loop on hover, link to Know Your Loads), quote, Why Yansa (three
  whole-card links: YanQ, Solutions, Services).
- **About**: photo hero, "We Measure. Solve. Support." cycling word, team
  statement, Industries tabs (4 tabs, fixed table height, sliding indicator),
  six FAQs (button + region accordion; FAQPage JSON-LD must match the text).
- **Solutions**: grid hero with a wave that settles from distorted to a clean
  sine and re-distorts under the pointer, problem > fix marquee, offered grid
  (chips that jump to the rows below), sticky Active/Passive/Hybrid jump bar,
  product rows with ids (`#active`, `#passive`, `#hybrid`), closing band.
- **Services**: photo hero, three alternating blocks (YanQ study links to
  yanq.html; Commissioning and AMC expand in place, deep links
  `#commissioning` / `#amc`), five-node engagement row.
- **Know Your Loads**: load explorer (ARIA tabs: loads > problem > Yansa's
  solution), three problem cards (swipe deck on phone), What Inaction Costs,
  "Now see it solved" fan of four match-the-fix cards.
- **YanQ**: photo hero, "What is YanQ", **How YanQ Works** (see below), What
  YanQ Delivers (2x2 icon cards), closing band with See the Solutions / Book a
  Diagnosis. The intro matches the Home Diagnosis type and spacing.
- **Contact**: photo hero, map + form ("Your Facility. Our Solution.").
- Hybrid product photos are stand-ins (`images/products/apfc-relay.jpg`,
  `svg-plus.jpg`) until Yansa sends real ones.

### YanQ "How YanQ Works" (`.yanq-works`, `initYanqWorks`)
Not pinned and not scroll-linked: four boxes (Measurement, Compilation, Report,
Recommendations) joined by drawn arrows, side by side on desktop, a 2x2 with an
elbow connector at 769-1023, rows on phone. When the section enters view each
box plays its process drawing in sequence, once (the ported player
`prepareDiagram` / `renderDiagram` / `resetDiagram` reads the SVG `data-a` /
`data-osc` attributes). Only opacity, transform and stroke-dashoffset move.
Diagrams are recoloured through `yd-clean` (teal), `yd-raw` (orange),
`yd-guide` (mist) and `yd-surface`. The heading colour `--works-title` (#989898)
is a deliberate grey inherited from the old page.

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
- **Motion**: scroll sequences are a pure function of scroll position (no
  time-based transitions driving them); in-view reveals may use
  IntersectionObserver + CSS transitions (transform/opacity only). Honour
  `prefers-reduced-motion` (the global `reduceMotion` flag in script.js) and
  reserve space for anything that animates in. Images carry width/height.
- **Copy**: "we offer", collaborative tone. Never "command" or "mandate".
- Match the existing comment style (short block comments explaining *why*).
- Run `node --check js/script.js` (and each `js/m/*.js` you touch) after JS edits.

## Dev tools (`docs/rework/tools/`, plain Node 22, no npm deps)
Start the server first (see Run locally); one headless Chrome at a time.
- `measure.mjs [pages]`: scroll heights at 1440x900 and 390x844, section
  heights, console errors, failed requests.
- `shots.mjs <label> <page> [--w 1440,390] [--sel css] [--settle ms]` and
  `shots.mjs <label> --nav [page]`: screenshots into the scratchpad.
- `links.mjs [--strict-img]`: internal links, anchors, images (alt, and
  width/height with --strict-img), retired URLs. Must exit 0 on both.
- `check-nav-footer.mjs`: nav/footer identical to index.html, one correct
  active item per page, drop-downs and phone toggle present.
- `check-head.mjs`: titles/descriptions unique, canonical + og:url, og:image,
  JSON-LD parses and holds no retired URL.
- `check-site.mjs`: `_redirects`, sitemap.xml vs the public pages, robots.txt,
  the `#services` forward, 404 nav/footer, tone grep (copy only).
- `check-dead-css.mjs [-v]`: class/id names in the CSS that no html/js uses;
  `-v` also lists unreferenced images.
- `cdp.mjs`, `frame.html`: helpers used by the above.

Planning docs for the rework: `docs/rework/{sitemap,audit,handoff,progress}.md`.

## Git / GitHub
- Repo: https://github.com/Paradex-Tech/Yansa (owned by the personal account
  **Paradex-Tech**; **paradexstudios** is a collaborator with write access
  and does the pushing).
- Repo-local commit identity: `Paradex Studios <paradexstudios@gmail.com>`.
- The rework lives on `restructure-v2` (from `main` @ 2e3c144), local commits
  only until the client signs off. `client-revamp-nov` is Sanya's earlier
  round (copy source only).
- **Hosting: Cloudflare Pages** (no build command, output directory = repo
  root). Config lives in `_headers` (security + cache headers) and `_redirects`
  (repo-only files go to /404; retired pages 301 to /solutions). Pages serves
  `/about.html` as `/about`, so absolute URLs (canonical, og:url, sitemap) are
  extensionless; relative links keep `.html` so the local server still works.
  A push to `main` deploys.
- **Never push without the user's explicit OK.**
- `.claude/` is gitignored.

## Forms backend (Google Sheet + Apps Script)
- Sheet "Yansa Website — Form Submissions" (paradexstudios Drive, folder
  "Yansa Assets"):
  https://docs.google.com/spreadsheets/d/1wDh7HBbQCDd6F639c01GRsWW4RpvoSir5ac-K3ro6YI/edit
  It has two tabs, Contact and Brochure. 4 rows labelled "TEST - Claude" can
  be deleted.
- Web app URL (in `js/script.js` as `FORMS_ENDPOINT`):
  https://script.google.com/macros/s/AKfycbziI_2OEZY-ufzPrK1xTGadr_j4ds01j6MWr78D6oC3xQEhfaPAeD96shMkJlCQXFaw2w/exec
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

## Working with this user
- Uses Hinglish casually; keep replies short and clear.
- Checks visual results on localhost themselves. Don't spend effort on
  browser screenshots or measurement unless asked.
- Don't undo a style or design choice the user explicitly asked for.
- Commit when asked; push only with an explicit OK.

## Phone layer
- Phones (<= 768px) have their own layer, separate from the desktop files: `css/m/<area>.css` (linked with
  `media="(max-width: 768px)"`, loaded after style.css so it wins by order) and `js/m/<area>.js` (each gated by
  `isPhone()`, builds/tears down on the media query `change`, cleans up the DOM it injects). Areas: `base` (every
  page: tokens, compact navbar + full-screen menu with sub-links, sticky bottom CTA bar, footer as a 2-column link
  grid, brochure bottom sheet), `home`, `about`, `solutions`, `services`, `loads` (know-your-loads), `yanq`,
  `contact` (contact + 404).
- The bottom CTA bar steps aside for a page's own CTA band: mark it `data-m-bar-end`.
- Desktop must stay untouched: never edit style.css/script.js for phone-only needs.
- Phone footer is 736 px on every page (under one 844 px screen).
- `measure.mjs` and `shots.mjs` emulate a 390 px mobile viewport; headless Chrome cannot go under 500px wide as a
  plain window.
- Known gaps: widths 769-900px (landscape phones, small tablets) use the desktop layout with a smaller nav; the
  contact page has no tap-to-call/mail cards because the site holds no phone/email/address yet.

## Open items / waiting on the user
1. Redeploy the Apps Script (see Forms backend above).
2. Add Sanya as a GitHub collaborator (from the **Paradex-Tech** owner account; username unknown).
3. Real hybrid panel photos from Yansa (stand-ins in use).
4. New copy for the Why Yansa cards if the client wants it changed.
5. Connect Cloudflare Pages and add the yansa.in domain.
6. Decide on the unused images listed by `check-dead-css.mjs -v`.
