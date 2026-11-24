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
