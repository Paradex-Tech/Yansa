# S10 Audit-2 small fixes                                   status: FROZEN 2026-11-24

Goal: apply the S and M fixes from the second audit that are clear improvements and keep the approved structure,
copy and old design identity. Everything else goes to Shrey (see `docs/rework/audit-2.md`).

Ground rule: several visual findings came from one-pass screenshots and may be capture timing (scroll-linked
reveals, count-ups, typewriters, pinned sequences). **Verify each V-item first** by scrolling slowly in steps and
waiting for the animation to finish (shots.mjs `--settle 6500`, or your own CDP script). If it is not real, do not
change anything; report "not reproduced". Keep every signature animation; add only what is needed.

## V-items (verify, then fix if real)
V1 Phone (<=768) floating "Book a Diagnosis" pill: make sure the end of the page is never covered: the footer's
   last row must clear the pill (add bottom padding = pill height + 16px to the footer on phone if missing). If the
   pill already has a hide rule, also hide it while the footer CTA band (the one with "Book a Diagnosis") is in view;
   otherwise add that with IntersectionObserver (opacity/transform only, reduced motion: instant).
V2 About, Industries tabs at 391-768: the tab row is cut mid-word with no cue. Add a right-edge fade mask that shows
   only while the row can scroll further right (toggle a class on scroll), plus `scroll-snap-type: x proximity`.
V3 Typewriter statement blocks (solutions "about-statement", about "about-statement"): after typing completes, if
   the reserved height leaves > 1 empty line below the final text, trim the reserved min-height to the final text
   height (all widths) and bring the bottom padding to the section rhythm. Must not cause layout shift while typing.
V4 Solutions "Solutions We Offer" category cards at 1440/820: card content clipped at the top or uneven heights.
V5 Solutions sticky Active/Passive/Hybrid chip bar: add `scroll-margin-top` (nav + chip bar height) to `#active`,
   `#passive`, `#hybrid` and every product card id, so nav-menu and chip jumps land with the heading visible; the
   chip bar must have a solid background where it overlaps content.
V6 Index and About hero subtitle at 481-768: lines wrap into a narrow lonely column under a wide title. Set the
   subtitle max-width to ~34ch at that range, centred like now.
V7 Index at 769-1024: Symptoms and Why Yansa cards in one stretched column with big empty areas? If so: Symptoms
   2 columns at 769-1024 (as desktop), Why Yansa 3 columns or the desktop pattern. Keep the symptom hover/line
   drawings working.
V8 Contact at 1440: map card and form column end at different heights -> `align-self: stretch` / matching height.
   At 391-768 the map is a short strip: min-height 320px, and 16-24px between "Open in Google Maps" and the edges.
V9 Know Your Loads at 391-768: "Not sure which load is behind it?" line sits tight under the explorer: 32px gap.
V10 404 at 391-768: ~230px empty below the buttons: trim to the section rhythm.
V11 YanQ hero at 391-768: subtitle contrast on the photo is borderline: deepen the existing overlay gradient on its
   lower part just enough for 4.5:1 (same overlay component, not a new style).
V12 YanQ "How YanQ Works" at 1440 (pinned/stepped reveal) showing one card with a large empty petrol band, and "What
   YanQ Delivers" second card reading "01" at 600: very likely capture timing. Verify only; fix only if real.
V13 Index at 481-768: ~160px empty cream under the intro buttons before the teal band: trim to section rhythm.

## Fixes (apply)
F1 Hero subtitles: `text-wrap: balance` on the photo-hero subtitles (`.header-placeholder__overlay p` and the Know
   Your Loads hero line) so no one-word last line (Contact: "...it from there."). No size or width change.
F2 About hero H1: markup "Refining Power" with `text-transform: uppercase` on its selector (desktop and
   `css/m/about.css`), so it looks identical but screen readers do not spell out capitals.
F3 About "We Measure." H2: its accessible name is only "We" (the cycling word is aria-hidden). Add a visually hidden
   "Measure." (`.sr-only`) inside the H2 so the heading reads "We Measure."; keep the live region and animation.
F4 About FAQ: link existing words in the answers (no wording changes): in "What is YanQ, and do I need one?" link
   the first "YanQ" mention in the answer to `yanq.html`; in "What exactly does Yansa do?" link a phrase naming
   solutions to `solutions.html` and one naming services/commissioning/maintenance to `services.html` if such words
   exist; in "Does Yansa deal in hybrid panels?" link "hybrid" to `solutions.html#hybrid`. Keep the FAQ JSON-LD text
   identical to the visible text (links do not change text). Style: the site's existing inline link style.
F5 Contact form error text (`js/script.js` initContactForm): there is no email address on the site, so change
   "Something went wrong. Please try again, or email us directly." to "Something went wrong. Please try again in a
   moment." (also the brochure form if it has the same text).
F6 Solutions "Solutions We Offer" Services column: order the three links like the nav (YanQ Power Quality Study,
   Commissioning Support (Online & Offline), Annual Maintenance Contract (AMC)). Text unchanged.
F7 Titles (SEO): `<title>` plus `og:title`/`twitter:title` where present:
   - solutions.html: "Power Quality Solutions: Active, Passive and Hybrid | Yansa"
   - services.html: "Power Quality Services: YanQ Study, Commissioning and AMC | Yansa"
   - know-your-loads.html: "Know Your Loads: Which Equipment Causes Power Quality Problems | Yansa"
   Leave every other title.

## Out of scope
Section order, copy (beyond F5 and the link wrapping in F4), the nav drop-downs (S9, done), images, Home length.

## Acceptance checks
1. `node --check` on every JS file touched; `check-nav-footer.mjs`, `check-head.mjs` (titles unique), `links.mjs
   --strict-img`, `check-site.mjs` all pass.
2. `measure.mjs`: 0 console errors, 0 failed requests; report desktop/phone heights per page before vs after.
3. Per V-item: "fixed" with before/after screenshot paths, or "not reproduced" with the evidence (settle time).
4. Reduced motion: shots of about, solutions, index at 600 with `--reduced` look complete.
5. Two UI rounds: after the first pass, capture 1440 / 820 / 600 / 390 shots of every page you changed and fix what
   you see; then capture again and hand back the round-2 folder.

## Hard gates
Scope respected; commit after each area; trailer exact; preview server on 8765 (pid 17488) left running; no
servers or Chrome left running.
