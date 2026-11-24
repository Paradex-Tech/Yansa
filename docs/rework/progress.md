# Rework progress log

- 2026-11-24: branch `restructure-v2` created from `main` @ 2e3c144. Audit (`audit.md`) and sitemap
  (`sitemap.md`) written. Waiting for Shrey's approval of the sitemap before any build.
  Local preview: `python -m http.server 8765 --bind 127.0.0.1` from the repo root.

## Build plan (FRIDAY, 2026-11-24)
Slices, in order (specs in `docs/rework/specs/`, frozen before each build):
- S1 shell: dev tools (measure/shots/links), nav with drop-downs, footer, new page files, old URLs.
- S2 YanQ (biggest scroll win, 13.8 -> 4.5 screens).
- S3 Solutions. S4 Services. S5 Know Your Loads. S6 Home. S7 About + Contact. S8 final pass.
Per section: references noted here, SHURI builds, then 2 UI rounds (headless shots read by VISION + a Claude-in-Chrome
look at desktop and phone), fixes between rounds, measure.mjs before/after.

## References (KAREN sweep, 2026-11-24; 21st.dev listings + Powerside)
- Nav drop-downs: 21st "Mega Menu Navbar" (BagUI, 21st.dev/@anelkabag/components/navbar2): small panel fades from
  y -6px / scale .97 over 150 ms, cubic-bezier(.22,1,.36,1), chevron rotates 180deg; phone nested list indented with a
  1px left rule. Powerside (powerside.com) for the Products / Services grouping.
- YanQ 4-step flow: 21st "Process Timeline" (shadcnui-blocks timeline-05), "How It Works" (olewandowski1 how-it-works-2):
  arrows drawn by stroke-dashoffset, staggered per step, once in view; vertical rail on phone.
- Solutions index + jump bar: Powerside Products & Solutions ("Select a Solution" anchor row, section + image cards
  + Learn More); 21st "Tabbed Feature Categories" (features-4). Active chip by IntersectionObserver.
- Services: Powerside Services (title, 1-2 sentence summary, Learn More); grid-rows 0fr->1fr expand, 40 ms stagger.
- Load explorer: selection-driven reveal like 21st "Radial Orbital Timeline"; crossfade 220 ms, 60 ms stagger.
- Tabs / FAQ: 21st "Animated Tabs" (Build UI), "Slide Tabs"; Kokonut "FAQ", scrollxui FAQ accordion.
- Footer: 21st "Minimal Footer" (Efferd), "Simple Centered Footer" (footer-16): 2-col link grid on phone.
- Wave hero: own build (noise term decaying e^(-t/0.9s) into a clean sine; pointer re-excites).

## S1 shell (done)
Commits d05a4d7 (tools), 95c815d (nav), ec6b180 (footer), fb30214 (pages, redirects, sitemap, 404), 47c5fce (Esc fix).
- Nav: 6 items + 2 drop-downs, one line 1440 -> 769 (type steps to Small at <=1100, Label at <=900; hamburger at
  <=768). Phone menu lists sub-links. Reference: 21st Mega Menu Navbar (panel/chevron timing).
- Footer: new columns; phone footer 1,139 -> 736 px on every page (2-col link grid). Reference: 21st Minimal Footer.
- solutions/services/know-your-loads files, solution.html + pq-solved.html removed, 301s in `_redirects`.
- UI round 1: headless nav shots at 1440/1280/1024/900/820/769/390 checked (no wrap, panels aligned).
  Round 2 rides on the S2 Chrome look (nav is on every page).

## S2 YanQ (done, 2 rounds)
Commits fda3d47, 4bdcfea, 4e51653, 962f976, cee9938, d98dd7d, 05016ce, 3cf1698 (round-1 fixes), 73afc39 (phone bar).
- Heights: desktop 12,405 -> 4,006 px (13.8 -> 4.45 screens); phone 7,119 -> 4,044 px (8.4 -> 4.8).
  How YanQ Works alone 10,004 -> 744 px desktop, 5,031 -> 950 px phone.
- How YanQ Works: 4 boxes + drawn arrows, old diagrams replayed in sequence on entering view (once); 2x2 with an
  elbow connector at 769-1023; phone rows (drawing left, text right) each playing as they enter view.
  Reference: 21st "Process Timeline" / "How It Works" (staggered arrow draw), the site's own Delivers cards.
- Round 1 (headless shots 1440/1024/820/390 + Chrome look at 1519 px): fixed the 2x2 arrow order (2 pointed at 4),
  Compilation leftover dots read as debris (now 35% opacity), resize across 768 now arms the right mode.
- Round 2 (shots s2-r2 + Chrome phone frame at 390): phone bottom bar stacked on the Next-step band's own
  "Book a Diagnosis"; fixed site-wide with `data-m-bar-end` on a page's CTA band.
- Note: http.server lets Chrome cache old CSS; hard-refresh when checking.

## S3 Solutions (done, 2 rounds)
Commits a60532b, 4e3b7e2, 51c7bdd, 8828dae, 0e68155, c4215da, f6e083c.
- Heights: old solution 6,033 + pq-solved 4,524 px desktop -> solutions 4,657 (5.17 screens);
  phone 7,485 + 5,316 -> 5,566 (6.59).
- Hero "Solutions." on the PQ Solved grid with a wave that settles from distorted (orange) to a clean sine (cyan)
  and re-distorts locally under the pointer (rAF only while moving). Chip index (Powerside "Select a Solution"
  pattern), cards get ids and a :target ring, Hybrid stand-in photos, closing band. References: Powerside Products,
  21st "Tabbed Feature Categories"; wave own build.
- Round 1 (headless shots + Chrome phone frame): chip tint colour, band line balance. Round 2: statement-to-offered
  gap too large on desktop and phone (padding trimmed).

## S4 Services (done, 2 rounds)
Commits d458878, 255be8c, 86b29fa, 724d9f4, fb2c203, + subline width fix.
- Heights: desktop 3,129 px (3.48 screens), phone 3,497 (4.14). New page.
- Three alternating photo/text blocks on a 12-col grid (Study > YanQ page; Commissioning and AMC expand in place
  with grid-rows 0fr->1fr, deep links #commissioning/#amc open the block), then a five-node engagement row whose line
  draws left to right in view (vertical rail on phone). References: Powerside Services (title, 1-2 sentences,
  Learn More), 21st alternating feature rows.
- Round 1 (SHURI's shots + my read): fine. Round 2 (Chrome phone frame + shots): engagement sublines wrapped
  2 words to a line; widened.
- YanQ block uses yanq-hero.jpg (yanq-analysis.jpg has garbled AI text).

## S5 Know Your Loads (done, 2 rounds)
Commits 73ba692, 93407f2, 40f54fe, faf12ce, 28b5949, 2daff1b, 54bfb60. Deleted css/m/solution.css, js/m/solution.js.
- Heights: desktop 4,597 px (5.11 screens), phone 4,947 (5.86). New page (replaces the second half of the old
  Solution page: 6,033 / 7,485 px for the whole old page).
- Load explorer: 3-column board (ARIA tabs list > Problem with the old load drawing, Seen in, chips > Yansa's
  solution with chip links to Solutions cards); fixed board height, crossfade, connector pulse; wrapping chips
  under 1100 px, scroll-snap row on phone. Problems: phone side-swipe deck with dots (1,654 px stack -> 507 px).
  Fan: four Match-the-fix cards in the old lean-and-settle fan. References: 21st "Radial Orbital Timeline"
  (selection-driven reveal), scroll-snap card pattern from the KAREN sweep.
- Round 1: fine on explorer/swipe; round 2: fan-to-footer empty petrol band and invisible boundary (fixed), and a
  regression check showing solutions/services unchanged by the cleanup (heights identical at af55864).

## S6 Home (done, 3 rounds)
Commits c4ebcdd, c102bc3, 7672377, c82e0a5, 3000381, 0cf6472, 63b3869, 9b4cb31.
- Heights: desktop 6,202 -> 5,073 px (6.89 -> 5.64 screens); phone 5,882 -> 5,064 (6.97 -> 6.00).
  Hero runway 2,521 -> 1,621 px desktop, 1,877 -> 1,286 phone.
- Hero: video replaced by the still (slow scroll-linked 1.06 -> 1 scale), same choreography, stages re-timed;
  compared old vs new at 12 scroll stops (1440/1024/390). New card photo images/hero-panel.jpg (frame from the old
  hero film at 10.5 s) replaces hero-plant.jpg, which repeated the still.
- Symptoms: four line drawings in the YanQ diagram hand (breaker trips, motor heats, kVAh meter climbs, gauge falls),
  play once in view and loop on hover; "Which loads cause these? Know Your Loads" link. Why cards are whole-card
  links with lift/arrow/focus ring. References: 21st "Animated Features Bento with Live Diagrams", Powerside home
  path cards.
- Round 2: desktop over target (6.11): dropped 100vh/80vh min-heights; duplicate image swapped. Round 3: Home
  section padding 120 -> 96 at >= 901 px. Desktop 5.64 stays above the 5.0 target: reaching 5 would need dropping
  a section or changing the symptom hover; left for Shrey.

## S7 About + Contact (done, 2 rounds)
Commits 335d1f9, d9d9541, a68b589, 4d62607, 5e5812d, e1ea861.
- About: 4,441 -> 4,040 px desktop (4.93 -> 4.49), phone 3,808 -> 3,759 (4.45). Contact 2,367 / 2,352 (2.63 / 2.79).
- About order: hero, We Measure (cycling word, moved up), team statement, Industries (4 tabs per sitemap, fixed
  table height, transform-only sliding indicator), FAQs (6, button + region accordion, grid-rows open, plus rotates,
  JSON-LD matches visible text). Our Values removed. Contact heading "Your Facility. Our Solution."
  References: 21st "Animated Tabs" (sliding indicator), Kokonut / scrollxui FAQ accordions.
- Round 2: the old per-cell tab glide with turning plus markers was replaced in round 1; restored (old motion is
  part of the identity), keeping the new indicator and fixed height.
