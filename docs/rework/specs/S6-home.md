# S6: Home (`index.html`) - FROZEN

Sitemap section 1. Targets: desktop <= 5 screens, phone <= 6 (old 6.9 / 7.0).

## Sections
1. **Hero**: keep "Engineering Power Quality", the shrink-to-card move with the four photos, then "We Measure What
   Others Miss." + Explore Solutions (`solutions.html`) / Contact Us. **Video removed**: the full-bleed film becomes
   the still `images/hero-poster.jpg` (1920x1080) playing the same choreography (shrink, radius, photos spreading).
   Give the still a very slow scale drift (1.06 -> 1.0 across the runway, scroll-linked) so it does not feel frozen.
   Pinned runway cut from ~2.8 to ~1.8 screens: shorten the runway values in `initHero`/CSS and re-time every stage
   so all of it still plays fully (no stage skipped or rushed; text never overlaps photos). Remove `initHeroVideo`
   and the `<video>`/source markup and preload hints; leave files in `videos/` in place. Phone hero (`js/m/home.js`):
   same still, its own runway shortened in proportion.
2. **Precision starts with Diagnosis.**: same paragraph and CTA plus one new line (Body tier, muted): "A team of
   doctorates in power electronics, backed by engineers and associates." Placed between paragraph and CTA.
3. **Symptoms precede failure. Always.**: the four cards keep layout and copy; each icon is replaced by a small
   inline SVG line drawing (same stroke weight/colours as the YanQ drawings, ~96-120 px) that animates when the card
   enters view, and replays subtly on hover (desktop):
   - breaker tripping: a breaker toggle flips from ON to OFF with a small spark;
   - motor running hot: a motor outline with heat waves rising and a thermometer bar climbing into orange;
   - bill meter climbing: a meter/bill with digits/bars ticking up and a rupee mark;
   - efficiency gauge falling: a gauge needle swinging down from green to orange.
   Stroke-dashoffset + transform only; loops only while hovered; reduced motion = final frame. Under the grid a link:
   "Which loads cause these? Know Your Loads" > `know-your-loads.html` (text link with arrow, old link style).
4. **Quote**: unchanged.
5. **Why Yansa?**: Measure / Solve / Support cards become links (whole card is one `<a>`): Measure > `yanq.html`,
   Solve > `solutions.html`, Support > `services.html`. Add a clear affordance: "Explore YanQ ->", "See Solutions ->",
   "Our Services ->" at the card foot, card lifts 4 px with a stronger border/shadow on hover, arrow nudges, visible
   focus ring.
- Footer CTA unchanged; phone footer from S1.
- Case studies stay hidden.

## Acceptance checks
1. measure.mjs index: desktop <= 5 screens, phone <= 6; no console errors (no video requests); links.mjs passes.
2. Hero shots at 6+ scroll positions through the runway at 1440 and 390 (label `s6-r1`): each stage shows fully,
   nothing overlaps, ends cleanly into section 2, no jump when the pin releases.
3. Symptom drawings: shots before/after in-view at 1440 and 390, reduced motion = final frame.
4. Why cards: keyboard focus visible, whole card clickable, hrefs correct.
