# S2: YanQ page (`yanq.html`) - FROZEN

Goal: 13.8 -> about 4.5 desktop screens (phone 8.9 -> about 5), keeping the page's look. Sitemap section 5.

## Sections
1. **Hero** (photo hero, unchanged look): remove the "Measure First. Solve Right." tag line; keep "YanQ" and
   "A structured Power Quality study." Remove the dead `.yanq-hero-intro__tag` CSS.
2. **What is YanQ** ("YanQ. The Study Before the Solution." + body + CTA): unchanged.
3. **How YanQ Works** (replaces the pinned `.yanq-flow` sequence and `initYanqFlow`):
   - Section heading "How YanQ Works." in the old flow title's style (H2 tier, "Q" accent as before), one short lead
     line under it reusing the old intro's first sentence: "Resolving power quality problems requires more than
     replacing components or resetting breakers." Petrol section background like the old flow stage, light text.
   - Four boxes in a row on desktop, joined by arrows: **Measurement** > **Compilation** > **Report** >
     **Recommendations**. Each box: "Step N" label, the step's existing process drawing (the four SVGs from the old
     flow, reused as they are, played by `renderDiagram`), the step name (H4 tier), and a 3-6 word tag:
     Measurement "Calibrated on-site acquisition", Compilation "Filtered to what matters",
     Report "Benchmarked to IEEE 519-2022", Recommendations "Solutions sized to your data". No paragraphs, no pills.
   - Box style: the old site's card language on petrol (thin `--line`-like light border at low opacity, existing
     radius, generous padding); drawings in the old diagram colours. Arrows: thin line + head, drawn in the site's
     orange/teal, same stroke weight as the drawings.
   - Motion (in-view, time-based, once): when the row is ~35% into the viewport, box 1 fades/rises 16 px, its drawing
     plays 0->1 through `renderDiagram` (~1.1 s, ease-out), then arrow 1 draws (~0.3 s), box 2 starts, etc.
     (~5 s total; boxes may overlap their starts by ~0.3 s so it never feels slow). After a drawing finishes, its
     oscillating wave elements (`data-osc`) may keep a slow, subtle loop only while in view. Reduced motion: all
     final state, no loop. No JS: all visible in final state.
   - Each box is focusable-free (not links); the whole row is a `<ol>` for semantics.
   - 1024-1280: same row, smaller drawings; 769-1023: 2x2 grid with arrows right and down-left logic replaced by a
     simple right/down arrow per box (no arrow crossing boxes). Phone (<=768): one column, a down arrow between boxes,
     each box plays its drawing when it enters view (individually), compact padding.
   - Delete the old pinned-sequence markup, its CSS (desktop and `css/m/yanq.css`) and `initYanqFlow` /
     `js/m/yanq.js` code that only served it. Keep `renderDiagram` and anything other pages use. Grep before deleting.
4. **What YanQ Delivers**: the four icon stats, unchanged in look. It used to receive the title morph from the
   flow; give it its own normal heading "What YanQ Delivers." (same tier/style) and make sure its reveal still works.
5. **Next step** (new, short band, cream): one line "Know what your power system is doing, then fix it right." (H3
   tier or Statement, pick what matches the old CTA bands) and two buttons: "See the Solutions" (`solutions.html`,
   outline style) and "Book a Diagnosis" (`contact.html#contact-form`, orange). Replaces "Enter PQ Solved".
- Nav: Services item active (from S1). Footer: as S1.

## Acceptance checks
1. measure.mjs yanq.html: desktop <= 4.8 screens (target 4.5), phone <= 5.5 screens (target 5). Report each section.
2. No console errors; links.mjs passes; `node --check` on touched JS; no references left to `initYanqFlow`,
   `.yanq-flow__` in html/css/js (unless still used, then say where).
3. shots.mjs yanq at 1440, 1024, 820 and 390 (label `s2-r1`): every drawing finishes in its box, nothing clipped,
   arrows aligned to box centres, no overlap; text readable on petrol (contrast >= 4.5:1 for the tags).
4. Reduced motion (emulate `prefers-reduced-motion: reduce` in shots via CDP `Emulation.setEmulatedMedia`): all
   drawings in final state on first paint, no loops.
5. No layout shift: boxes have reserved size before drawings play (CLS ~0 in the shots sequence).
6. Hero, What is YanQ and Delivers look the same as the baseline shots except the removed tag line and new heading.

## Pre-mortem
- renderDiagram is coupled to the old global progress (`data-win`): feed each SVG its own 0->1 progress, ignore
  `data-win` or map it; check every element type (draw, fade, stream, drift, slide, rise, grow, osc) ends correctly.
- Deleting shared code another page uses: grep `js/script.js` and `js/m/*` before removing anything.
- Petrol section feels heavy at 4 boxes with small drawings: keep drawings at least 220 px wide at 1440.
