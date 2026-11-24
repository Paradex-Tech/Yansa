# S12 Services: interactive engagement row                    status: FROZEN 2026-11-24

Goal: on services.html "How an engagement runs." the five steps respond to hover and focus in a minimal way that
shows progress through the engagement.

Shrey: "make this part interactive on hover, very minimalist."

## Reference
21st.dev stepper / timeline components (progress fill along the connector up to the active step, earlier steps lit,
later steps muted). Rebuilt in vanilla CSS/JS on the existing `.svc-flow__row` markup (an `<ol>` of `.svc-step`
links, each with `.svc-step__num`, `.svc-step__word`, `.svc-step__line`). Keep its existing draw-in line animation
(the signature, from S4) and add only what is below.

## Design
1. One **progress fill** layered on the existing connector line: a second line in the step accent colour
   (teal-deep / the site's step teal) that scales (`transform: scaleX`, origin left; vertical rail on phone:
   `scaleY`, origin top) from step 1's centre to the hovered/focused step's centre. 320 ms
   cubic-bezier(.2,.7,.2,1). The JS sets one CSS variable on the row (`--to: 0..4`) or a scale value; CSS does the
   motion. When nothing is hovered or focused, the fill is at 0 (row looks exactly as today).
2. **Steps**: steps up to and including the active one: circle fills to the solid accent (number turns
   `var(--ivory-card)`) and the active circle scales to 1.08; later steps drop to ~0.45 opacity on word and line
   text (circles 0.6). Transform/opacity/colour only. No cards, boxes or shadows.
3. **Tagline**: the active step's tagline (`.svc-step__line`) moves up 2px and goes to full ink colour. No extra
   line of copy (no new copy), so no space needs reserving and nothing below moves.
4. **Keyboard**: the steps are already links, so focus-visible triggers the same state; the focus ring stays.
   Leaving the row (pointer out and focus out) resets to the default look after ~120 ms (no flicker moving between
   steps; moving across gaps keeps the state).
5. **Touch / phone (<= 768 and `(hover: none)`)**: no hover state. When the row first comes into view, the fill
   runs once from step 1 to step 5 (about 1.2 s total, stepping through each circle), then stays fully lit. Tapping
   a step follows its link as today. Use the existing IntersectionObserver pattern in the file.
6. **Reduced motion**: no scaling or travel; state changes are instant (colour/opacity only); phone shows all steps
   lit with no run.
7. The row's height and every step's position are unchanged at all widths (measure before/after).

## Out of scope
Copy, links, the S4 draw-in animation, other sections, other pages.

## Acceptance checks
1. A CDP script hovers step 1..5 at 1440 and 1024 and reads: fill scale matches the step (within 2%), active circle
   scale 1.08, later steps' opacity < 0.6; mouse out resets to 0 within 400 ms.
2. Keyboard: Tab into the row, focus step 3: same state as hover on step 3; Tab out resets.
3. 390 and 600 emulated touch: after scrolling into view the row ends fully lit; reduced motion: fully lit, no
   transform anywhere (computed style).
4. Section height identical before/after at 1440, 820, 600, 390 (`measure.mjs services.html`), 0 console errors;
   `node --check` passes; `links.mjs --strict-img` passes.
5. Two UI rounds with shots (hover step 1, 3, 5 at 1440; 820; phone end state) and a short screen capture or a
   sequence of 4 shots mid-transition for one hover.

## Hard gates
Same as 00-common; preview server on 8765 left running; trailer exact.
