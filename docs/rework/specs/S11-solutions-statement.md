# S11 Solutions: team statement band + offered chips          status: FROZEN 2026-11-24

Goal: on solutions.html the change from "who we are" (The Right Solution Starts Here.) to "what we offer"
(Solutions We Offer.) reads at a glance, instead of one long cream area of text.

Shrey: "a bit plain. The text is good and simple, but it looks a LOT texty. Maybe we can separate this paragraph
and the lower one by something that creates a visual difference."

## Reference
21st.dev stats / feature bands (split layout: statement left, 3 stats right, hairline dividers, large numerals);
Powerside "About" band (dark band with figures). Rebuilt in the site's own tokens and the petrol-band language
the site already uses (Home quote band, Know Your Loads fan, footer).

## Design (build this)
1. `.pqs-intro` (the "The Right Solution Starts Here." section) becomes a **petrol band** (`var(--petrol)`, text
   `var(--text-on-dark)`, accents `var(--cyan)` / the site's on-dark accent), same section padding rhythm as the
   other petrol bands, with the faint concentric-circle / wave decor the other petrol bands use if one exists as a
   reusable class (do not draw a new decor).
2. **Split layout at >= 1024 px**: left column (7/12) the H2 and the existing paragraph, unchanged copy (keep the
   `accent` span and whatever reveal/typewriter it has today); right column (5/12) a **stat stack** of 3 rows,
   divided by 1px hairlines in `rgba(241,241,230,0.18)`-equivalent via a token mix (no new literal if avoidable):
   - "40+" (Numeral tier) / "IEEE publications" (Small tier) — from the paragraph's own claim.
   - "PhD" (Numeral tier) / "Doctorates in power electronics and power systems" (Small tier).
   - "519" (Numeral tier) / "Every site benchmarked to IEEE 519-2022" (Small tier).
   Numerals count up once in view (40+ only; the others fade/rise) with transform/opacity, reduced motion = final
   state. Stats are a `<dl>` (term = label, definition = figure) or a list with visually-ordered figure first;
   screen readers must read e.g. "40+ IEEE publications".
3. 769-1023 px: stats become a 3-across row under the paragraph. <= 768 (phone, `css/m/` file the page uses):
   stats as a 3-across compact row if it fits at 390 (figure Statement tier or H3 tier), else a 1-column list with
   hairlines; designed at 390 and 600.
4. `Solutions We Offer.` stays cream, unchanged except item 5. The two sections now contrast by band colour.
5. **Offered chips**: at wide widths (check 1440, 1680, 1898, 1920) chip labels like "Static VAR Generator (SVG)",
   "Active Harmonic Filter (AHF)", "YanQ Power Quality Study" wrap to two lines and "Commissioning Support (Online &"
   may be clipped. Fix: no chip label may be clipped at any width 320-1920; at >= 1280 every chip fits on one line
   (widen the grid/columns, `white-space: nowrap` only if the column guarantees room, or let a chip wrap cleanly
   inside its own pill with balanced lines below 1280). Verify at the widths above with a script that compares each
   chip's scrollWidth to clientWidth and counts text lines.
6. Page length: solutions desktop <= 5.5 screens at 1440x900 (now 5.16); phone not more than +300 px.

## Out of scope
All copy (except the 3 stat labels above), section order, other pages, nav, offered column contents (S10 F6
reorders Services: keep that).

## Acceptance checks
1. Shots at 1440, 1898 (or 1920), 1024, 820, 600, 390 of both sections; reduced-motion shot at 1440.
2. Chip script: 0 clipped chips at 320-1920 (step 40 px + 1898); 0 two-line chips at >= 1280.
3. Contrast: body text and stat labels on petrol >= 4.5:1 (compute from tokens).
4. `measure.mjs solutions.html`: heights within item 6, 0 console errors; `links.mjs --strict-img`, `check-site.mjs`
   pass; `node --check` on touched JS.
5. Two UI rounds: look at round-1 shots, fix what you see, hand back round-2 shots.

## Hard gates
Same as 00-common; preview server on 8765 left running; trailer exact.
