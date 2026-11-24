# S8: Final pass across the whole site - FROZEN

No new features. Find and fix defects; change nothing that works.

## Checks (scripts first, then eyes)
1. `links.mjs` exits 0 and `links.mjs --strict-img` exits 0 for every page (add width/height + `height:auto` where CSS
   sizes an image; never distort). `node --check` on every js file.
2. `measure.mjs` on all pages: 0 console errors, 0 failed requests; record desktop/phone heights in a table and
   compare with the targets in `docs/rework/sitemap.md` (phone footer < 844 everywhere).
3. Nav on every page: correct active item (YanQ page = Services), drop-downs on all pages, phone menu on all pages.
   Footer columns identical on every page. Script it (parse each page's nav/footer, diff against index.html apart
   from the active state).
4. `_redirects`: 301s for /solution, /solution.html, /pq-solved, /pq-solved.html -> /solutions, and repo-only
   paths (AGENTS.md, backend, docs, _headers, _redirects) -> /404; `solutions.html#services` forwards to services.html.
   `sitemap.xml` lists exactly the public pages (index, about, solutions, services, know-your-loads, yanq, contact,
   privacy-policy, terms) with extensionless absolute URLs like the existing entries. `robots.txt` points at it.
5. Every page's `<head>`: unique title and description, canonical + og:url extensionless and correct, og:image
   present, JSON-LD valid JSON (parse it) with no retired URLs.
6. Tone grep across html/js: no "command", "mandate" (case-insensitive, copy only). No "PQ Solved" left in copy.
7. Dead code: grep for CSS selectors in style.css and css/m/*.css whose class/id appears in no html or js file (list
   them; delete only the ones clearly from retired sections: old yanq-flow, about-values, pqs-fit, generates,
   solution-hero leftovers not used by KYL). Unused images under images/ that nothing references: list only.
8. 404.html renders with nav/footer and its links work.
9. Shots label `s8` of every page at 1440 and 390 (stepping, settled), plus nav drop-downs at 1024 and the phone
   menu. Look at every frame for: misalignment, clipped text, broken reveals (sections left blank), contrast,
   inconsistent spacing between pages, double CTAs on phone.
10. Update `AGENTS.md` to the new structure (adapt `git show client-revamp-nov:AGENTS.md`): pages, nav, phone files,
    tools in docs/rework/tools, YanQ works section, home hero still; remove stale notes (video hero, yanq-flow,
    wave tile). Remove `images/icons/yanq-wave-tile.svg` if nothing references it.

## Acceptance
All script checks pass; a short defect list with each item fixed or explained; AGENTS.md current.
