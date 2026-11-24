# S14 Audit-2 decisions (Shrey, 2026-11-24)                     status: FROZEN 2026-11-24 (rev 1 before build: section H; rev 2 during build: section I; rev 3 during build: section J; all Shrey via JARVIS)

Build Shrey's approved items from `audit-2.md` (D1, D2, D4, D5, D6, D7, D9, D10-removal) plus one phone fix. Ground
rules: keep the old design language and every signature animation; change only what is listed; font sizes only via
the section-3 tiers in `css/style.css`; colours/spacing from `:root` tokens; phone layer in `css/m/*.css` and
`js/m/*.js`; no new images; tone "we offer". Commit after each area (one commit per item group below).

## A. Home length (D1)
A1 Symptoms ("Symptoms precede failure. Always."): at >= 1200 px the four cards sit in ONE row of four. Line
   drawings, play-once-in-view and loop-on-hover stay; card look unchanged apart from width. 769-1199 keeps 2 columns
   (S10 V7). Phone unchanged (swipe row) apart from C.
A2 Quote band: padding on the 96 px Home rhythm (same as other Home sections at >= 901 px); text and look unchanged.
A3 Target: Home desktop (1440x900, measure.mjs) about 5.0 screens (<= 4,600 px). Nothing removed.

## B. CTA system (D2)
Rule: a button that goes to the contact form says "Book a Diagnosis"; a button that goes to `yanq.html` says
"See how YanQ works".
B1 index.html "Start With a Diagnosis" (href yanq.html) -> "See how YanQ works" (same href, same button style).
B2 index.html intro "Contact Us" (contact form) -> "Book a Diagnosis".
B3 yanq.html "What is YanQ" button "Start With a Diagnosis" (contact form) -> "Book a Diagnosis".
B4 solutions.html "Start with YanQ" (yanq.html) -> "See how YanQ works".
B5 Grep all pages, `js/script.js`, `js/m/*.js` (phone pill, menus): no "Start With a Diagnosis", no "Contact Us"
   button to the form, no other label for a form-bound button. Nav text link "Contact" (a page link) stays.
   Inline "Learn More" links stay.

## C. Phone swipe rows: clipped shadows (Shrey via JARVIS)
C1 Home symptoms phone swipe row: the active card's shadow is cut in a hard line below the card (scroll container
   overflow). Fix so the shadow fades out naturally: padding inside the scroll container (bottom and sides as
   needed) with matching negative margin so nothing else moves, or a softer/shorter shadow if padding can't work.
   Cards' look and size otherwise unchanged; pagination dots stay where they are (within 4 px).
C2 Check every other phone horizontal scroller (Know Your Loads problems deck, Know Your Loads explorer chip row,
   About industry tabs, any other `overflow-x` row at <= 768) for the same clipping and fix the same way.
   List each one checked in the hand-back (clipped yes/no, fixed how).

## D. Contact form (D4)
D1 contact.html form, after Facility/Company: "Phone (optional)" `<input type="tel" name="phone"
   autocomplete="tel" inputmode="tel">` not required; then "I'm interested in" `<select name="interest">` with
   options (value: label): "" : "Choose one (optional)", `yanq`: "YanQ Power Quality Study", `solution`: "A solution
   (active, passive or hybrid)", `commissioning`: "Commissioning Support", `amc`: "Annual Maintenance Contract (AMC)",
   `not-sure`: "Not sure yet". Optional. Same `.form-field` markup, label `for`, look of existing inputs (a select
   styled like the inputs, with a chevron consistent with the site; keyboard and phone native picker work).
D2 Pre-select: `contact.html?interest=<value>#contact-form` selects that option (only known values; anything else
   ignored). Small code in `initContactForm` or near it.
D3 `backend/forms.gs`: contact `fields` add `phone`, `interest`; `headers` add 'Phone', 'Interested In'. New columns
   go AFTER 'Page' so existing sheet columns stay aligned (row = timestamp, old fields, page, phone, interest). In
   `getSheet`, if an existing sheet's header row is shorter than `form.headers`, write the missing header cells.
   Keep `clean()` on the new values. Do not deploy. `worker/index.js` only serves /videos: confirm, no change.
D4 sendForm already sends every named field (FormData); confirm phone and interest reach the POST body (check in
   the browser with FORMS_ENDPOINT pointed nowhere is fine: assert via a unit-ish node/CDP check of the
   URLSearchParams, no real submission).
D5 Phone layout (`css/m/contact.css`) keeps the form readable; height growth on contact page <= 220 px desktop.

## E. YanQ page (D5, D6, D7)
E1 "What to expect" row directly after How YanQ Works (before What YanQ Delivers). Compact: an H2-tier heading
   is NOT wanted; use a small label/H3-level heading "What to expect" and four short items in one row at >= 1024,
   2x2 at 769-1023, stacked list on phone. Section height <= 360 px desktop, <= 520 px phone. Style from existing
   tokens and the page's own components (e.g. the step tag / deliver-stat text styles), no new illustrations, no
   numbers like "01" that repeat Delivers. Optional: a gentle once-in-view fade/rise using the site's existing
   reveal pattern; reduced motion shows it complete. EXACT copy (do not add or change facts):
   1. "Your energy bills" / "We start by analysing the energy bills issued by your electricity authority."
   2. "Measurement on site" / "We measure power quality data at your facility with calibrated instruments."
   3. "A detailed report" / "You receive a detailed power quality report, benchmarked against IEEE 519-2022."
   4. "Clear recommendations" / "We offer recommendations for power factor improvement and harmonic mitigation, sized to your data."
   (Sources, for progress.md: 1 brochure "Yan-Q Power Quality Analysis" list "Analysis of Energy Bills issued by
   Electricity Authorities"; 2 brochure "Power Quality Data Measurement of Facility" + site yanq.html step 1
   "Calibrated on-site acquisition"; 3 brochure "Detailed Power Quality Report" + site "Benchmarked to IEEE
   519-2022"; 4 brochure "Recommendations for Power Factor Improvement / Harmonic Mitigation" + site "Solutions
   sized to your data". No durations, turnarounds, prices or access requirements: none are sourced.)
E2 Remove the `.yanq-next` section (markup) and its now-unused CSS in style.css and css/m/yanq.css. The phone
   floating pill must still hide over the footer CTA band on yanq.html (it used `data-m-bar-end` on yanq-next; make
   sure the footer band hides it as on other pages).
E3 "Benchmarking+" -> "Benchmarking" (and in any JSON-LD/meta/AGENTS.md copy).

## F. Services ask links (D9)
F1 In the Commissioning block body, after its Learn More/detail: a small text link "Ask about commissioning" ->
   `contact.html?interest=commissioning#contact-form`; AMC block: "Ask about an AMC" ->
   `contact.html?interest=amc#contact-form`. Style: the site's existing small inline/arrow link style (like
   `.svc-more` with arrow, or the Home "Know Your Loads" link), visibly secondary to Learn More, visible without
   expanding. Keyboard focus ring as other links.

## G. Case studies: remove completely (Shrey: there is none and none will be added)
G1 Delete the hidden `#case-studies` section from index.html, the hidden footer "Case Studies" link from every page,
   the `.cases`/`.case-card` CSS in style.css and css/m/*.css (incl. the `#case-studies` selectors and the token
   comment at ~line 63 if it only serves cases), `initCaseStudies` and its call in js/script.js, and any js/m code
   for it. Delete `images/case-0*-photo.jpg` only if nothing else references them (grep). No dangling selectors in
   comma lists.
G2 Update AGENTS.md (remove the case-study lines), sitemap.xml if it lists it. Site-wide grep for "case stud"
   (case-insensitive) in html/css/js returns nothing.

## H. Footer hierarchy (Shrey via JARVIS: phone footer "too cramped")
Today (phone): logo, follow line, LinkedIn, then a 2-col grid of 11 equal links with dividers and chevrons, then
copyright and Back to top: a wall of rows. Reference pattern (Linear, Stripe, 21st "Minimal Footer"): grouped link
columns under small muted labels, a quiet legal row beside the copyright, more space between groups than rows.
H1 Markup (identical on every page; check-nav-footer.mjs must pass; update the script only if its expectations are
   the old structure, keeping it strict): replace the three unlabeled `.footer__col` with two labelled groups:
   "Explore": Solutions, Services, YanQ, Know Your Loads; "Company": About, FAQs, Careers, Contact. Labels are
   small headings (Label tier, uppercase or the site's existing eyebrow style, muted colour on petrol), not links.
   Drop the Home link (the logo links home: make the footer logo a link to `./` with aria-label "Yansa home" if it
   is not one already). Privacy Policy and Terms of Use move to a small legal row with the copyright (Small/Label
   tier, muted). The 404 page footer has no CTA above it; keep that working. Hrefs stay the same as today.
H2 Phone (<= 768, css/m/base.css): brand block kept (logo, follow line, LinkedIn, old look); the two groups side by
   side (2 columns) with labels; rows without per-row dividers and chevrons (at most one divider between brand,
   links and legal zones); each link tap target >= 44 px tall; gap between groups/zones clearly larger than between
   rows; legal row: "© 2026 Yansa · Privacy · Terms" style (use the real link labels "Privacy Policy", "Terms of Use"
   if they fit on one or two short lines) plus Back to top, kept. Phone footer height (measure.mjs footer value) <=
   820 px.
H3 Tablet and desktop: same grouping with labels in the existing column layout; legal links move to the bottom
   row with the copyright. Keep the old desktop look otherwise (fonts, colours, brand block, spacing rhythm);
   desktop footer height within +-60 px of 601.
H4 Old design language: petrol footer, existing tokens and tiers only; no new icons.

## I. Solutions jump landing (Shrey via JARVIS, rev 2)
On phone, tapping "Passive" in the sticky Active/Passive/Hybrid chip bar stops too early: the previous section's
carousel pagination dots show just under the bar, then a big cream gap, then "Passive Solutions".
I1 Tune the landing (scroll-margin-top on #active/#passive/#hybrid, and/or the section top padding involved, and/or
   the JS offset if a script scrolls) so each jump lands with the section starting cleanly under the sticky
   nav + chip bar: nothing from the previous section visible below the bar, and a small comfortable gap (about
   16-32 px) between the bar's bottom edge and the section heading. Same for Active and Hybrid.
I2 Same rule at desktop (1440) and tablet (820/1024), and for nav drop-down panel links and any other links that
   jump to #active/#passive/#hybrid (from other pages too, e.g. know-your-loads.html chip links to cards keep
   their S10 V5 card offsets working). Don't change the section layout or spacing in normal scrolling beyond what
   the landing needs.
I3 Evidence: a CDP script that, for each width (1440, 820, 390) and each of the three anchors, loads
   solutions.html#<id> (and clicks the chip), waits for the scroll to settle, and reports: chip-bar bottom y,
   heading top y (gap), and whether any element of the previous section intersects the area below the bar.

## J. Phone menu overlay sizes and accordions (Shrey via JARVIS, rev 3)
Today (js/m/base.js + css/m/base.css): main items ~32 px, sub-items ~15 px always expanded, 01-06 numbers
top-aligned, a teal line stub under the active item's number. Reference pattern: Linear / Vercel mobile nav,
21st mobile menus (calm display size, disclosure rows with chevrons, height-animated sub-lists).
J1 Sizes: main items to the H4 tier (24 px; add the selector to the tier in style.css section 3, or the phone
   tier equivalent in css/m/base.css if the menu's sizes live there) ; sub-items to the Body tier (17 px) with a
   touch more contrast than now (existing tokens, e.g. --text-on-dark at higher opacity). Weight/fonts as today.
J2 Solutions and Services become accordions: the row label stays a link that navigates; a separate chevron button
   (replaces the arrow) toggles the sub-list with a smooth height animation (grid-rows 0fr->1fr or measured height,
   ~250 ms, the site's easing; reduced motion: instant). Collapsed by default; the group of the current page
   (solutions.html for Solutions; services.html or yanq.html for Services) starts open. Toggle: `<button
   aria-expanded aria-controls aria-label="Show Solutions links">`, >= 44x44 px; every row and sub-link >= 44 px
   tall. Collapsed sub-links are not focusable (hidden/inert when closed).
J3 Numbers 01-06 align with the item text (baseline or centred on the first line). Remove the teal stub under the
   active number; active cue = teal item text (and optionally a small teal dot), nothing else.
J4 Keep: dark petrol gradient, "MENU" label, orange Book a Diagnosis button, Download Brochure link, the
   open/close animation, Esc/close behaviour, focus trap if present.
J5 Collapsed, the whole overlay fits without scrolling at 390x667 and 390x844 (check scrollHeight <= clientHeight
   of the scroll container, both accordions closed, on a page where none starts open, e.g. about.html).

## Acceptance checks
1. `node --check js/script.js` and each touched `js/m/*.js` pass.
2. `node docs/rework/tools/links.mjs --strict-img`, `check-nav-footer.mjs`, `check-head.mjs`, `check-site.mjs`,
   `check-dead-css.mjs` pass (no new dead CSS from this slice).
3. measure.mjs: Home desktop <= 4,600 px; YanQ desktop smaller or within +150 px of before (4,006 before S14 base);
   no console errors on any page.
4. Grep: no "Start With a Diagnosis", no "Benchmarking+", no case-stud in html/css/js; every `btn` link to
   contact form reads "Book a Diagnosis"; every `btn` link to yanq.html reads "See how YanQ works".
5. contact.html?interest=amc selects AMC; ?interest=bogus selects nothing; form POST body includes phone and
   interest (shown by a script, not a real submission).
6. forms.gs: contact row order = Timestamp, Full Name, Email, Facility/Company, Message, Page, Phone, Interested In.
7. Shots at 1440, 1024, 820, 390 (settle 6500 for scroll-linked parts) of each changed area show no clipped
   shadows, no overlaps, symptoms 4-across at 1440, What to expect row tidy, ask links visible.
8. Reduced motion: What to expect and symptoms complete.
9. Footer: check-nav-footer.mjs passes; phone footer <= 820 px; every footer link >= 44 px tall on phone;
   shots at 390, 820, 1440 show the two labelled groups and the legal row.
11. Section J: shots of the open menu at 390x667 and 390x844 (closed, Solutions open, on solutions.html);
    no-scroll check at 667; toggles keyboard-operable with aria-expanded updating.
10. Section I script: 9 landings, gap 16-32 px, no previous-section element visible under the bar.
