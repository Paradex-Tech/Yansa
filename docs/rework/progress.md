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
