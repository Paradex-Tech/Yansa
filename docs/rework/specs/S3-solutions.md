# S3: Solutions page (`solutions.html`) - FROZEN

Replaces `solution.html` + `pq-solved.html` (sources: `git show main:pq-solved.html`, `git show main:solution.html`).
Sitemap section 3. Targets: desktop <= 5.5 screens, phone <= 7.

## Sections (in this order)
1. **Hero**: the PQ Solved grid hero (`.pqs-hero`, `initPqHover` grid light + rings kept), title **"Solutions."**
   (keep the two-word split animation style: one word now). Replace the "Distortion in, clean power out" line with a
   wave graphic: one SVG line across the hero's lower third that starts as a distorted wave (fundamental + 5th and
   7th harmonics, irregular amplitude) and settles into a clean sine over ~1.6 s after load (ease-out); afterwards
   pointer movement over the hero locally re-distorts the wave near the pointer (gaussian bump around pointer x,
   amplitude decays back to clean over ~0.6 s) as if the filter is correcting it. Path computed in JS
   (`requestAnimationFrame` only while something changes or the pointer is in the hero; stop otherwise). Stroke in
   the site's orange fading to teal/clean colour as it settles. Keep a short sub-line under the title in the old
   hero's lead style: "Active, passive and hybrid power quality solutions, sized to what your site's data shows."
   Reduced motion: clean sine, static. Phone: same wave, no pointer, settle on load.
2. **Problem > fix strip**: the existing marquee, unchanged.
3. **The Right Solution Starts Here.**: heading (H2 tier) with the team statement (doctorates, 40+ IEEE
   publications) right under it, from `main:solution.html` `.about-statement--wide`. Remove "That is how Yansa
   works." wherever it appears. Calm reveal like the old statement sections.
4. **Solutions We Offer.**: the 4-column overview from `main:solution.html` `.offered`, heading with "Solutions" as
   the cyan/teal accent (not "Offer."). Columns Active, Passive, Hybrid (Active + Passive), Services. No red on
   "Active". Every item is a chip that looks clickable (pill, `--line` border, small arrow that nudges 3 px right on
   hover, background tint on hover/focus, visible focus ring) and jumps to its card below (`#active`, `#passive`,
   `#hybrid`, or the specific card id); Services items go to `services.html#commissioning`, `services.html#amc`,
   `yanq.html`. Smooth scroll respecting the sticky nav + jump bar offset (`scroll-margin-top`). On phone the four
   columns become a 2x2 or stacked compact list, not a tall stack.
5. **Sticky jump bar**: Active · Passive · Hybrid (drop Services). Follows the row in view, as in PQ Solved.
6-8. **Active / Passive / Hybrid rows**: as in PQ Solved (photo cards + expand). Hybrid cards now have photos:
   APFC panel uses `images/products/apfc-relay.jpg`, AHF panel uses `images/products/svg-plus.jpg` (stand-ins; add an
   HTML comment saying so). Hybrid card markup/behaviour identical to Active/Passive cards. Give each card an id so
   the chips can target it.
9. **Not sure which one?**: short band (cream, like the old CTA bands): heading "Not sure which one fits?" + one
   line "Start with a YanQ study, or see which loads cause which problems." + two buttons: "Start with YanQ"
   (`yanq.html`, orange) and "Know Your Loads" (`know-your-loads.html`, outline).
- Remove the old Services row (moved to the Services page) and the "Match the fix" section (moves to KYL in S5).
- Keep the `#services` -> `services.html` forward script from S1.
- Phone CSS/JS: page-specific `css/m/solutions.css` / `js/m/solutions.js` if `solution.css` no longer fits (it
  served the old Solution page); delete phone code that only served the retired pages once nothing uses it.

## Acceptance checks
1. measure.mjs: desktop <= 5.5 screens, phone <= 7; no console errors; links.mjs passes.
2. Every chip lands with its target card fully visible below nav + jump bar (check 3 chips via CDP: click, then read
   the target's `getBoundingClientRect().top` >= header bottom).
3. Wave: shots at t=0.1 s (distorted) and t=2.5 s (clean) at 1440 and 390; reduced motion is clean at first paint;
   idle hero uses no rAF (check via a CDP counter or code reading).
4. shots `s3-r1` at 1440, 1024 and 390 for every section: chips look clickable, no clipped text, hybrid photos crop
   like the other product photos.
5. `grep -i "That is how Yansa works"` finds nothing. No red "Active" label.

## Pre-mortem
- Wave rAF runs forever and costs CPU: stop the loop when settled and pointer out.
- Anchors hidden under the sticky bar: set scroll-margin-top from the real header + bar height.
- Copying pq-solved + solution sections duplicates CSS blocks: reuse existing classes, don't fork them.
