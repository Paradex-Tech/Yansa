# S5: Know Your Loads (`know-your-loads.html`) - FROZEN

Sitemap section 6. Targets: desktop <= 6 screens, phone <= 7. Sources: `git show main:solution.html` (load cards
with their animated drawings in `.generates`, `.problems`, `.inaction`, `.pq-entry` fan) and
`git show client-revamp-nov:know-your-loads.html` lines ~116-250 (load explorer copy: 8 loads, "seen in",
problem, chips, Yansa's solution) with its `initLoadExplorer` (content and logic ideas only; restyle to the old look).

## Sections
1. **Hero**: photo hero from S1 (`solution-hero.jpg`), "Know Your Loads." + one line: "Every load leaves a signature
   on your power. Here is what each one does, and how we fix it."
2. **Load explorer** (`#explorer`): heading "Which loads run your facility?" (H2 tier). Three columns:
   **Loads** (a vertical list of 8 selectable items: drives, textile machines, welding and presses, UPS and servers,
   offices, furnaces, motors, paint shops) > **Problem** (the selected load's animated drawing from the old
   "Loads Responsible" cards where one exists, else the nearest one, then "Seen in", the problem text and chips) >
   **Yansa's Solution** (solution text + 1-3 links to the matching Solutions rows/cards, e.g. `solutions.html#active`).
   - ARIA tabs pattern (roving tabindex, arrow keys, Home/End); selecting updates both columns with a crossfade
     (outgoing fades 120 ms, incoming fades + rises 8 px 220 ms); a thin animated connector between the columns
     (arrow/line) pulses once on change. Selected load has the old site's active style (accent bar + tint).
   - The columns keep a fixed min-height so switching never shifts the page.
   - Phone: the load list becomes a horizontal scroll-snap chip row on top; Problem and Solution stack below.
3. **The Problems These Loads Create.**: Harmonics, Power Factor, Voltage Instability from `main:solution.html`
   `.problems`, same desktop look and sticky stacking as before. Phone: side-swipe cards (scroll-snap, ~85% card
   width with the next card peeking, dots or "1/3" indicator), replacing the 1,654 px stack.
4. **What Inaction Costs.**: the three photo cards, unchanged look.
5. **Now see it solved.**: the old `.pq-entry` fan (with `data-pq-progress`), but its three cards now carry
   "Match the fix to the problem" (from `main:pq-solved.html` `.pqs-fit`): Low power factor, High harmonics,
   Fast-changing loads (each > its Solutions row), Keeping it solved (> `services.html#amc`). Four cards: adapt the
   fan to four without crowding (or keep 3 in the fan and the 4th as a row beneath; choose what looks best, note it).
   Button: "Enter Solutions" > `solutions.html`.
- Phone CSS/JS: `css/m/loads.css`, `js/m/loads.js` (move the bits of `solution.css/js` it needs; afterwards delete
  `css/m/solution.css`/`js/m/solution.js` only if no page uses them).

## Acceptance checks
1. measure.mjs: desktop <= 6 screens, phone <= 7; no console errors; links.mjs passes.
2. Explorer: all 8 loads selectable by click and keyboard; columns update; no height jump between loads (measure the
   section height for each of the 8 selections via CDP: identical).
3. Phone swipe cards: scroll-snap works, cards not clipped, section <= 1.2 phone screens.
4. shots `s5-r1` at 1440, 1024, 390 (explorer shot with 3 different loads selected).
5. Reduced motion respected (fan in final state, no crossfade movement).
