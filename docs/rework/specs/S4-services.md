# S4: Services page (`services.html`) - FROZEN

Sitemap section 4. Targets: desktop <= 3.5 screens, phone <= 4.5. Copy from `git show client-revamp-nov:services.html`
(lines ~110-160: Commissioning, YanQ, PQ Study, AMC + Learn More bullet lists), content only.

## Sections
1. **Hero**: photo hero (from S1, `hero-plant.jpg`), "Services." + one line: "Support that starts before the
   equipment arrives and stays long after it runs." Same markup/classes/motion as the About/Contact heroes.
2. **Service blocks**: three wide blocks, alternating image left / right on desktop (Powerside style): image, small
   label ("01 Study", "02 Commission", "03 Maintain"), name (H3 tier), one or two sentences, "Learn More" link.
   - `#yanq-study` **YanQ Power Quality Study**: merge Sanya's YanQ + PQ Study copy into one block (2 sentences max).
     Image `images/products/yanq-analysis.jpg` (or `yanq-hero.jpg` if the crop is better). Learn More > `yanq.html`.
   - `#commissioning` **Commissioning Support** (onsite and online): image `images/products/service-commissioning.jpg`.
     Learn More expands the detail list in place (Sanya's bullets).
   - `#amc` **AMC** (Annual Maintenance Contract): image `images/products/service-amc.jpg`. Learn More expands in place.
   - Expand: button with `aria-expanded`/`aria-controls`, label switches to "Show less", chevron rotates; the panel
     animates open with the grid-rows 0fr->1fr technique (no height animation in JS), list items fade in with a
     small stagger. Deep link `services.html#commissioning` / `#amc` scrolls there and opens that block.
   - Images: same radius and photo treatment as the old site's product/inaction photos; a gentle in-view reveal
     (image scale 1.04 -> 1 + text rise 16 px, once). Blocks separated by generous section spacing, not boxed cards.
   - Phone: image on top (16:10 crop), text below, compact spacing.
3. **How an engagement runs**: one thin row of five steps: Measure > Report > Solve > Commission > Support, each a
   small numbered node with the word and a 2-4 word line, joined by a thin line that draws left to right when the
   row enters view (~1 s), nodes light in sequence. Measure/Report link to `yanq.html`, Solve to `solutions.html`,
   Commission to `#commissioning`, Support to `#amc`. Phone: a vertical list with a line on the left, or a 5-node
   compact horizontal row if it fits 390 without clipping (choose the cleaner one).
- Footer as S1. Phone CSS: `css/m/services.css` (+ `js/m/services.js` only if needed).

## Acceptance checks
1. measure.mjs: desktop <= 3.5 screens, phone <= 4.5; no console errors; links.mjs passes.
2. Learn More: keyboard toggles, `aria-expanded` updates, deep link `#amc` opens AMC. Reduced motion: no animation.
3. shots `s4-r1` at 1440, 1024 and 390, blocks closed and one open: alignment of alternating blocks on one grid,
   no clipped text, images crisp and cropped well.
4. Tone grep: no "command"/"mandate"; copy reads "we offer".
