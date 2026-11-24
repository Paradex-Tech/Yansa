# S7: About (`about.html`) and Contact (`contact.html`) - FROZEN

Sitemap sections 2 and Contact. Targets: About desktop <= 4.5, phone <= 4.5. Contact unchanged length (2.7 / 3.3 or less).

## About, in this order
1. Hero "REFINING POWER": unchanged.
2. **We Measure. Solve. Support.** (cycling word section): moved up to second. Its scroll/cycle behaviour must still
   work in the new position (check its trigger offsets).
3. **Team statement** ("Once your problem is solved, our team stays to support you..."): now third.
4. **Industries We Serve.**: same tab component, 4 tabs and lists exactly as in `docs/rework/sitemap.md` section 2
   (Industrial; Commercial & Healthcare; Data Centres & Critical Infrastructure; Energy Transition). No "Power
   Quality" tab. Tab panel heights must not jump between tabs (reserve the tallest). Keyboard tabs pattern intact.
   Phone: tabs as a horizontal scroll-snap row if four labels don't fit.
5. **FAQs**: six questions in the sitemap order. Answers: reuse `git show client-revamp-nov:about.html` (~lines
   242-300) for "What is power quality?", "Why is power quality important?" (downtime, equipment failure, penalties
   on bills), "How is Yansa different from others?", "Does Yansa deal in hybrid panels?" (yes, we are a system
   integrator of hybrid panels); keep the old answers for "What exactly does Yansa do?" and "What is YanQ, and do I
   need one?" (update any link to solution/pq-solved). Remove the pricing question and the old last question.
   Update the FAQPage JSON-LD in `<head>` to match exactly.
- **Our Values** removed: markup, CSS (desktop + `css/m/about.css`) and JS (`js/script.js` / `js/m/about.js`) that
  only served it. Grep before deleting.

## Contact
- Form heading becomes **"Your Facility. Our Solution."** Nothing else changes.

## Acceptance checks
1. measure.mjs about, contact: targets met; no console errors; links.mjs passes.
2. FAQ JSON-LD questions == visible questions (script check). Accordion keyboard works.
3. Tabs: 4 tabs, no height jump (measure each), phone row not clipped.
4. shots `s7-r1` at 1440 and 390 of both pages.
5. Tone grep on all copy.
