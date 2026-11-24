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
