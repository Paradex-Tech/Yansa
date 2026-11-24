# S16 Know Your Loads redesign                         status: FROZEN 2026-11-24

Goal: Know Your Loads looks and moves like the approved pages (Home, Solutions, Services, YanQ) on desktop and phone,
with the load explorer as a polished interactive tool. Direction A "Field guide" from `docs/rework/kyl-redesign.md`
(read sections 1 and 2 first: the diagnosis says what to remove).

## In scope
`know-your-loads.html` markup, the KYL rules in `css/style.css` (`.solution-hero` where not shared, `.loads-x`,
`.problems`, `.problem-card`, `.inaction*`, `.pq-entry*`, `.glimpse*`, and their tier-selector entries in section 3),
`css/m/loads.css`, `js/m/loads.js`, `initLoadExplorer` and any KYL-only code in `js/script.js`.
New class names are fine (prefix them `kyl-` or keep `loads-x`).

## Out of scope (must not change)
Every other page. Shared components (nav, footer, buttons, tiers' sizes, `.header-placeholder`, the
`.solution-hero, .services-hero` shared group) may only change if every other page's heights stay identical
(check 2). Section order and copy (sitemap section 6). No new images; existing files in `images/` only.

## Sections (order fixed)
1. **Hero.** Same family as Services: photo `images/solution-hero.jpg`, centred H1 "Know Your Loads." and the lead.
   Desktop stays as is (shared rules). Phone: same height and type as the Services phone hero (506 px at 390, H1 and
   Lead tiers); drop the forced `<br>` effect on phone (let `text-wrap: balance` do it).
2. **Load explorer** (`#explorer`, ivory background).
   - Header: centred H2 "Which loads run your facility?" (accent word kept).
   - >= 1100 px: three columns, not boxed as one panel. Col 1 (about 30 %): eyebrow "Loads", then the 8 loads as an
     index list on the section background, hairline between rows, number + full name, Body size. One petrol
     highlight (radius like the site's cards) glides behind the selected row (transform transition 280-350 ms,
     ease-out); the selected row's text turns cream and an arrow appears at its right edge pointing into the sheet.
     Hover on other rows: text to petrol, number to teal, faint tint; no layout shift.
     Cols 2+3: one ivory "load sheet" card in the Solutions offered-card style (hairline border, same radius and
     shadow family) split into two panes with a hairline divider:
     - Problem pane (about 55 %): eyebrow "Problem"; a petrol "signature plate" (Home symptom-card petrol, rounded)
       holding the load's existing drawing in teal/cream line colour; "Seen in" label + text; H3 problem title; body
       at Body size; the chips as quiet hairline tags (no coloured dots).
     - Solution pane (about 45 %, faint teal or cream tint): eyebrow "Yansa's solution" in teal; title; body; the
       product links as the Solutions offered-pill component (same look as `solutions.html` offered pills), pinned to
       the bottom of the pane.
     - One small connector on the divider (petrol circle, cream arrow) that pulses once on each change. No other
       arrow buttons, one eyebrow style (Services `svc-block__label` look or the site eyebrow), no three dot colours.
   - 600-1099 px: the loads become a 4 x 2 grid of tiles above the sheet (number + name; selected tile petrol with
     cream text); sheet panes side by side.
   - < 600 px: a 2 x 4 grid of tiles with short names (Drives, Textile, Welding & presses, UPS & servers, Offices,
     Furnaces, Motors, Paint shops; the full name stays the tab's accessible name via `aria-label` or visible text on
     wider screens), then the Problem pane, then the Solution pane, stacked in one card. All eight loads visible
     without scrolling sideways. Picking a tile never scrolls the page.
   - Behaviour: ARIA tabs (tablist/tab/tabpanel, roving tabindex). Arrow keys (Up/Down and Left/Right), Home, End move
     focus and select; visible focus ring. Content crossfade 200-300 ms with a small rise; the drawing replays on
     each pick. All eight items share one grid cell so the board height is the same for every load at every width
     (no jump). Without JS the first load shows.
   - The "Not sure which load is behind it? A YanQ study measures it for you." line sits centred under the board in
     the Home "Which loads cause these? Know Your Loads ->" style (grey text, orange underlined link, arrow).
3. **The Problems These Loads Create** (cream background). Centred H2 (accent kept). Three cards in the Home
   symptom-card language: petrol background, the existing drawing top-left recoloured to teal/cream line (CSS
   `stroke`/`fill` overrides), number, hairline, H4 title, Small text in muted cream. Drawings play once in view and
   on hover (as today). Phone: the existing swipe deck with dots, same cards, on the cream background (not a petrol
   band).
4. **What Inaction Costs** (ivory background). Centred H2 + the sub-line under it. Three full-photo cards at every
   width (the current phone treatment): photo fills the card, dark bottom gradient, tag as a pill at the top-left on
   all three, H4 title and Small text over the photo, contrast AA. Desktop three across (card about 4:5 or 1:1);
   phone keeps the swipe deck with dots.
5. **Now see it solved / Match the fix** (cream background, hairline top border; light, so the page does not end in
   two petrol bands). Left column: eyebrow "Match the fix to the problem", H2 "Now see it solved." (accent kept),
   the lead, "Enter Solutions" button (keeps `data-m-bar-end`). Right: the four cards as whole-card links in a 2 x 2
   grid of ivory cards (Home why-card behaviour: hover lift, arrow nudge, focus ring), each with its tag
   ("01 · Passive"...), H4 title, Small text, arrow. Same hrefs as today. On entering view the cards settle in a
   short stagger (once; the fan's idea without overlap). Phone: four compact stacked rows (tag, title + arrow, text).
   The old fan, rings and translucent glass cards go.

## Acceptance checks
1. Scope: `git diff --name-only d3ce416 -- . ':!docs'` lists only `know-your-loads.html`, `css/style.css`,
   `css/m/loads.css`, `js/m/loads.js`, `js/script.js`.
2. Other pages unchanged: `node docs/rework/tools/measure.mjs` totals and section heights for every page except
   know-your-loads equal `docs/rework/tools/out/measure-pre-s16.json` (desktop and phone).
3. Length: KYL desktop <= 4,500 px (5.0 screens at 900), phone <= 5,064 px (6.0 at 844).
4. Type: desktop sizes only through the section 3 tiers (no literal `font-size` px in KYL rules outside section 3);
   phone: `node docs/rework/tools/phone-type.mjs 390 know-your-loads.html` and at 360 show only S15 tier sizes; no
   KYL-local `--fs-scale` or multipliers.
5. Explorer height constant: for each of the 8 loads at 1440, 1024, 390 and 360 the `#explorer` height is identical
   (script; record the numbers in the hand-back) and `scrollY` does not change on a pick.
6. Keyboard: Tab reaches the selected load; ArrowDown/ArrowRight/ArrowUp/ArrowLeft/Home/End move and select (8 loads,
   wraps); `aria-selected`, `tabindex` and `aria-labelledby` of the panel stay correct (script).
7. Reduced motion (`shots.mjs --reduced`): no glide, fade, pulse, stagger or drawing loop; everything visible.
8. No horizontal overflow at 1440, 1024, 820, 390, 360; visible controls >= 44 px in both dimensions on phone
   (except inline text links).
9. Links: the 16 product pills, the 4 match cards and "Enter Solutions" keep today's hrefs; `links.mjs --strict-img`
   passes.
10. `check-nav-footer.mjs`, `check-head.mjs`, `check-site.mjs`, `check-dead-css.mjs` pass; `node --check js/script.js
    js/m/loads.js`; measure.mjs shows 0 console errors.
11. Copy: visible text of `main` equals before apart from the phone short tile names and any wording listed in the
    hand-back.
12. UI rounds: two per section at 1440, 1024, 390 and 360 (FRIDAY + VISION), at least one live in Chrome.

## Hard gates
Checks 1-3, 5, 6, 8-10. No new image files. Local commits on `restructure-v2` only, one per area (A hero + explorer,
B problems + inaction, C match the fix), message ending with the repo's attribution line.

## Pre-mortem
- **Shared CSS bleeds into Services or other pages** (`.solution-hero, .services-hero` group, tier selector lists,
  the reveal list in `initReveal` that names `.inaction` selectors). Avoid: add KYL-only selectors, don't edit
  shared declarations; check 2 compares every page.
- **Scroll-linked reveals leave new elements invisible** (opacity 0 until a reveal that no longer matches). Avoid:
  update the reveal selector list for the new markup; screenshots are taken scrolling in steps and with `--reduced`.
- **Explorer jumps or the highlight sits on the wrong row** after resize, font load or the 1100 px switch. Avoid:
  stacked single-cell grid for items; highlight position recomputed on pick, resize and `document.fonts.ready`
  (or done in pure CSS on the active row); check 5 at four widths.
