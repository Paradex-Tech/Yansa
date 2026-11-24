# Know Your Loads redesign (S16, 2026-11-24)

Shrey: "Everything looks good, just the Know Your Loads page doesn't look good with its existing design."
Every other page is approved. Goal: KYL must read as the same site as Home, Solutions, Services and YanQ.
Content and section order stay as in `sitemap.md` section 6. Spec: `specs/S16-kyl-redesign.md`.

## 1. Diagnosis (looked at 1440, 1024, 390 next to Home, Solutions, Services; head d3ce416)

Heights before: desktop 4,644 px (5.16 screens), phone 4,958 (5.87). Sections desktop / phone: hero 811 / 641,
explorer 885 / 1,231, problems 599 / 494, inaction 720 / 644, pq-entry 894 / 1,114, footer 647 / 770.

1. **Four card languages on one page.** A white bordered app panel (explorer), solid bright-orange cards (problems),
   petrol cards with a thin photo strip (inaction) and grey translucent glass cards (fan). The approved pages use two:
   ivory cards with hairline borders and pill links (Solutions, Services) and petrol cards with line drawings (Home
   symptoms). Orange is the site's CTA colour everywhere else; here it fills three whole cards, which is the loudest
   block on the page and says "button" rather than "problem".
2. **The explorer looks like a SaaS settings widget, not a Yansa section.** Everything (list included) sits in one
   boxed panel split into three equal-ish columns. Three different eyebrow dot colours (petrol, orange, teal), round
   arrow buttons sitting on the column borders, a salmon icon tile, chips with orange dots and full-width solution
   pills: five small UI devices in one view. Body text is Small (15 px) in narrow columns, so the Problem column is a
   tall grey block while the Solution column is half empty below its two pills. The selection state is a pale mint
   fill with a 3 px orange tick: weak for the one control the page is about.
3. **No background rhythm.** Explorer, problems and inaction sit on three creams that differ by 1-2 %, with 100+ px of
   padding each, so the first half reads as one long beige stretch with no boundaries; the second half is one long
   dark stretch, because the petrol fan section runs straight into the petrol footer (Solutions and Services end on a
   light band before the footer).
4. **Headings drift.** Explorer and problems headings are centred with a teal accent word, inaction is left with no
   accent and an 18 px lead, the fan heading is left and vertically centred beside the cards. Home and Solutions keep
   one alignment per section type (centred heading + grey one-line sub above card grids).
5. **Desktop and phone tell different stories.** Problems are on cream with flat cards on desktop but on a petrol band
   with big numerals on phone; inaction is a thin photo strip on desktop but full-photo overlay cards on phone (the
   phone version is the better one).
6. **The fan is muddy and long.** Translucent grey cards overlap mid-animation (text clipped under the next card at
   the 1440 screenshot stop), each card repeats a tag, an "Explore" link and a text block; on phone it becomes four
   stacked grey cards (1,114 px), the longest section after the explorer.
7. **Inconsistent link and card details.** The "Not sure which load..." line uses a teal underline (Home uses the
   orange underlined link with arrow for the same kind of line); inaction tags sit beside the title on two cards and
   wrap below it on the third; problem icons are 70 px drawings floating in 370 px cards.
8. **Hero is fine but off-family on phone.** Same desktop rules as Services (811 px), but the phone hero is 641 px
   against Services' 506 and keeps a forced `<br>` in the lead.

## 2. Two directions

### A. "Field guide": editorial list + load sheet, light-led (chosen)
- **Explorer:** Loads > Problem > Yansa's Solution kept as three columns, but un-boxed. Left: the eight loads as a
  numbered index list on cream with hairline rows and one petrol highlight that glides to the selected row (cream
  text, arrow pointing into the sheet). Right: one ivory "load sheet" card in the Solutions card style, split into
  a Problem pane (a petrol signature plate carrying the load drawing in teal line, "Seen in", H3 title, body at Body
  size, quiet hairline tags) and a tinted Solution pane (teal eyebrow, title, body, the Solutions pill links anchored
  to the bottom). One connector on the pane divider pulses on change. Under 1100 px the list becomes a 4 x 2 tile
  grid above the sheet; on phone a 2 x 4 grid of short-named tiles (all eight visible, no hidden scroll row), then
  Problem, then Solution.
- **Problems:** the Home symptom-card language: three petrol cards, line drawing top-left, number, hairline, title,
  short text. Phone: same cards in the existing swipe deck, on cream (as desktop).
- **Inaction:** the phone treatment on every width: full-photo cards with a bottom gradient, tag pill top-left, title
  and text over the photo; centred heading + sub like Home symptoms.
- **Match the fix:** light band (closes the page on light before the petrol footer, like Solutions): copy block left
  (eyebrow, "Now see it solved.", lead, Enter Solutions), four whole-card links right in a 2 x 2 grid of ivory cards
  (Home why-card behaviour: lift, arrow nudge, focus ring), entering with a short staggered settle that keeps the
  fan's idea. Phone: four compact rows.
- References: Stripe and Linear vertical feature tabs with a sliding indicator (selection-driven panel, no layout
  jump); 21st.dev "Feature tabs / vertical tabs with animated indicator" and the "Radial Orbital Timeline" used in S5
  (selection-driven reveal); Powerside's application pages (problem then the product that fixes it, product links as
  quiet rows); the site's own Home symptom cards, Solutions offered cards and Services eyebrows. These are pattern
  references from earlier sweeps and well-known sites, not pages re-fetched for this job.

### B. "Instrument console": dark analyser panel
- **Explorer** as one large petrol console in the YanQ analyser look: an 8-segment load selector across the top, a
  large animated waveform trace per load in the centre, Problem and Solution readouts in two columns underneath with a
  flow line between them (the YanQ 4-box flow idiom).
- **Problems** as a cream strip of three inline items, **inaction** as a horizontal pinned photo gallery, **match the
  fix** kept as the fan on petrol.
- References: Linear's product tab demos, Stripe's dashboard-style product heroes, Powerside's monitoring software
  pages, the site's YanQ flow.

### Why A
- It is built only from components Shrey has already approved (Solutions cards and pills, Services eyebrows, Home
  symptom and why cards), which is the brief: "look like it belongs to the same site".
- It keeps Sanya's three-column Loads > Problem > Solution sketch visible at desktop, which B dissolves.
- B needs new large waveform art for eight loads (the existing drawings are icon scale; generators are banned), an
  8-segment bar cannot show full load names at 1024 without scrolling, it adds a third big dark block to a page that
  already ends dark, and a pinned gallery adds runway (length) and scroll-jacking the other pages avoid.
- A shortens the page (target about 4,150 px desktop, 4,450 phone) and gives it a light / dark / light rhythm:
  photo hero, cream explorer, cream problems with dark cards, photo cards, light match-the-fix, petrol footer.

## 3. Build log
(rounds, heights and findings per section are added below as the build runs)

- **Area A (hero + explorer)** 4a2e689; round 1 (FRIDAY, headless 1440/1024/390): list too narrow (names wrapped),
  list edge off the container, solution pills pinned leaving a 200 px hole (spec revised 17d70fd), tile grid and
  sheet edges differ at 1024, "Welding & presses" wrapping -> fixed in 67e3acc.
- **Area B (problems + inaction)** 12d0ad5, **area C (match the fix)** a4cbfaa.
- **Round 2** (VISION opus, 9 sheets opened, 8.5/10, no blockers; FRIDAY live in Chrome at ~1568 px and frame.html
  390): connector crowding the Solution eyebrow at 1024 and 390, problem drawings too small -> fixed in 66a0eec.
  Not taken: Match-the-fix copy column vertically centred (VISION wanted top-aligned; live it reads balanced, its
  still was mid-reveal); floating "Book a Diagnosis" bar over content (site-wide, unchanged on purpose); empty space
  under the solution pills on short-solution loads (tallest-item board, no jump).
- Heights after: desktop 4,218 px (4.69 screens; was 4,644), phone 4,890 (5.79; was 4,958). Sections desktop /
  phone: hero 811 / 506, explorer 822 / 1,379, problems 558 / ~555, inaction 637 / 654, match 654 / 978.
