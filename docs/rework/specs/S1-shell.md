# S1: Dev tools, site shell (nav, footer, page files, old URLs) - FROZEN

Scope: tooling, nav, footer, new page files, redirects, sitemap.xml, 404. No page content work beyond what is listed.

## 1. Dev tools (`docs/rework/tools/`, never published)
- Add `docs` to `.assetsignore` and `/docs/*  /404  302` to `_redirects` (same pattern as `/backend/*`).
- `cdp.mjs`: tiny helper that launches headless Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  `--headless=new --remote-debugging-port=<free> --user-data-dir=<scratch tmp>`), talks CDP over Node 22's global
  `WebSocket` (no npm deps), and always kills Chrome on exit/error.
- `measure.mjs [pages...] [--base http://127.0.0.1:8765]`: default = every public `*.html` page. For each page at
  1440x900 and 390x844 (mobile emulation, deviceScaleFactor 1): load, scroll to the bottom in steps of ~0.5 viewport
  with ~120 ms pauses (so reveals and pinned runways settle), scroll back to top, then read
  `documentElement.scrollHeight`, the height of each `main > section` (id or first class) and `footer`, console
  errors and failed/404 requests. Print a compact table (px and screens = px / viewport height) and write JSON to
  the path given by `--out` (default `docs/rework/tools/out/measure-latest.json`, gitignored).
- `shots.mjs <label> <page> [--w 1440,390] [--sel css] [--base url]`: saves viewport-sized PNGs stepping down the
  page (scrolling in small steps between frames so scroll-linked motion is in its real state) to
  `C:\Users\Asus\AppData\Local\Temp\claude\1127f2370ec5f6b0\37fba964-ce4f-43d2-a765-6650c4ca23e9\scratchpad\shots\<label>\`
  named `<page>-<w>-<nn>.png`. With `--sel`, scroll that element into view in steps and capture just the
  viewport(s) covering it. Also `--nav` mode: capture the header at 1440, 1280, 1024, 900, 820, 769 and 390 widths,
  with each drop-down open once (hover/focus).
- `links.mjs`: static scan of every public html: each internal `href`/`src` resolves to a file (or a `_redirects`
  rule), each `#fragment` exists as an id on the target page, no link to `solution.html` or `pq-solved.html`, every
  `<img>` has width/height and alt. Exit 1 on any failure.
- `frame.html?src=/x.html&w=390&h=844`: a page with one unscaled iframe of that size (for Claude-in-Chrome phone looks).
- Baseline: `git archive main` into the scratchpad (`scratchpad\baseline\`), serve it on 8766, run measure.mjs on it
  (save JSON as `docs/rework/tools/out/measure-baseline.json`) and `shots.mjs baseline` for index, about,
  solution, pq-solved, yanq, contact at 1440 and 390. Stop that server afterwards. The numbers should be close to
  `audit.md`; report any big gap.

## 2. Nav (every page)
- Items: Home · About Us · Solutions · Services · Know Your Loads · Contact, then the orange "Book a Diagnosis".
- Drop-downs: Solutions > Active Solutions (`solutions.html#active`), Passive Solutions (`#passive`), Hybrid
  Solutions (`#hybrid`). Services > YanQ Power Quality Study (`yanq.html`), Commissioning Support
  (`services.html#commissioning`), AMC (`services.html#amc`). The top-level labels link to `solutions.html` /
  `services.html`.
- Behaviour: opens on hover (with a ~150 ms close delay so the pointer can travel) and on keyboard focus; a chevron
  button next to the label toggles it with `aria-expanded`; Esc closes and returns focus; click outside closes.
  Panel in the old site's language (ivory/cream card, `--line` border, soft shadow, existing radius), fade + 6-8 px
  rise, ~180 ms, chevron rotates; no motion under reduced motion. Panel never shifts layout.
- Active state: the current page's item; on `yanq.html` the Services item is active.
- **One line** at every width from 1440 down to 769 px: logo, six items and the CTA never wrap or overlap (tighten
  gaps/letter spacing at narrower widths through the existing tiers; at 769-1024 the CTA may shorten its padding).
  At <=768 the existing phone menu (`js/m/base.js`) lists all items, with the drop-down children shown as indented
  sub-links under Solutions and Services; same open/close animation as today.

## 3. Footer (every page)
- Link columns: [Home, About, Solutions, Know Your Loads] [Services, YanQ, Contact, FAQs (`about.html#faq`)]
  [Privacy Policy, Terms of Use]. Keep "Careers" only if it fits the column cleanly; keep the hidden Case Studies link
  hidden.
- Phone: the whole footer (CTA block + bottom) is under 844 px tall at 390 px on every page (today 1,139), target
  ~760. Tighten spacing, make link columns a 2-col grid, keep every link and button, no clipped text.

## 4. Page files and old URLs
- Create `solutions.html` (start as a copy of `pq-solved.html` content, title "Solutions | Yansa", canonical
  updated), `services.html` and `know-your-loads.html` (photo hero only: `hero-plant.jpg` "Services." and
  `solution-hero.jpg` "Know Your Loads.", using the same `.header-placeholder` hero markup and classes as About,
  with proper title/meta/canonical/OG like the other pages, then the footer). Phone CSS/JS hooks wired (reuse
  `solution.css/js` for now).
- Delete `solution.html` and `pq-solved.html`. `_redirects`: 301 `/solution`, `/solution.html`, `/pq-solved`,
  `/pq-solved.html` to `/solutions` (copy lines from `client-revamp-nov:_redirects`, check the clean-URL form the
  site uses). On `solutions.html` a tiny inline script sends `#services` to `services.html`.
- Update every internal link site-wide (index, about, yanq, contact, 404, privacy-policy, terms) to the new pages.
  `sitemap.xml`: add the three new pages, remove the two retired ones (see `client-revamp-nov:sitemap.xml`).
- 404 page links to Home, Solutions, Services, Contact.

## Acceptance checks
1. `links.mjs` exits 0. `node --check` passes on every touched JS.
2. `shots.mjs --nav`: no wrap or overlap at 1440, 1280, 1024, 900, 820, 769; drop-downs open, aligned under their
   label, fully on-screen; phone menu shows sub-links.
3. measure.mjs: phone footer < 844 px on every page; no console errors, no failed requests on any page.
4. Keyboard: Tab reaches each drop-down item; Esc closes. Reduced motion: no transition on the panel.
5. `grep -rn "solution.html\|pq-solved" *.html js css` finds nothing except the redirect script.
6. Old look unchanged: compare `shots` of about/contact at 1440 against the baseline; only nav and footer differ.

## Pre-mortem
- Nav wrap fixed at one width but breaks at another: check every listed width, not just 958.
- Phone footer shrunk by hiding links: never remove links or buttons.
- Retired pages still linked from a page the scan misses (404, legal pages, JSON-LD, OG tags): scan includes them.
