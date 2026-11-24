# S15 Phone pass (frozen 2026-11-24)

Source: `docs/rework/audit-phone.md` (scale table section 1, findings section 2). Build the scale, then the
findings, area by area, one commit per area.

## Areas (in order)
- **A Shared** (`css/m/base.css`): tier tokens and line-heights per the scale table at <= 599 px; `--fs-scale: 1`
  forced on phone; text-wrap rules; buttons 48 high / 16 px / padding 0 24; legal pages top padding (finding 15);
  404 buttons (18). Commit "S15 A: phone type scale, buttons, legal and 404".
- **B Home** (`css/m/home.css`): findings 1, 8, 14, 16 (diagnosis, quote), 17 (symptom dots, KYL line link).
- **C About + Contact** (`css/m/about.css`, `css/m/contact.css`): findings 2, 3, 4, 5, 9 (About), 12 (Contact),
  16, 20.
- **D Solutions + Services + YanQ** (`css/m/solutions.css`, `css/m/services.css`, `css/m/yanq.css`; JS only if the
  statement's reserved height is set in JS): findings 6, 7, 9, 10, 11, 12, 13, 16, 17 (product dots, family tabs), 19.

## Rules
- Phone only: every new or changed rule sits inside `@media (max-width: 599px)` (600-768 and desktop must not
  change). Never edit `css/style.css`, any `.html`, or `css/m/loads.css` / `js/m/loads.js` (KYL is out of scope).
- Change sizes, weights, spacing and layout polish only. No copy, section order, section removal or new images.
  Keep every animation (home hero pin, symptom deck, quote word reveal, typing statements, swipe rows, YanQ flow).
- Fonts only through the tier tokens; no new literal font-size except where a tier is multiplied today (remove the
  multiplier instead).

## Acceptance checks
1. `git diff --name-only e894deb` lists only the css/m files above (plus `js/m/solutions.js` or `js/m/about.js` for
   finding 10 if needed, and docs).
2. Every new rule is inside a `max-width: 599px` media block (grep the diff).
3. Type inventory at 390 (scratchpad `phone/inventory.mjs 390`): each role in the audit table renders at its tier
   size (display 44, H1 34, H2 29, statement 24, H3 22, H4 20, numeral 40, lead 17, body 16, small 14, label 13);
   no heading above 44 px; About body copy 16/17 only. At 360 the clamped values (40/31/27/22/36).
4. No horizontal overflow at 390 or 360 on any in-scope page.
5. Tap targets: no visible control under 44 px in either dimension except inline text links inside paragraphs and
   the honeypot input.
6. `measure.mjs` desktop totals equal `out/measure-pre-phone.json` for every page; phone totals do not grow by more
   than 5 % on any page.
7. `links.mjs --strict-img`, `check-nav-footer.mjs`, `check-head.mjs`, `check-site.mjs`, `check-dead-css.mjs` pass.
8. Solutions statement: once fully typed, the gap between the last text line and the first stat row is <= 48 px at
   390 and 360. Home symptom card: icon-to-title empty band <= 48 px.
9. Live look (FRIDAY, Chrome via `docs/rework/tools/frame.html?src=/page.html&w=390&h=844` and `w=360&h=780`):
   two UI rounds per area.
