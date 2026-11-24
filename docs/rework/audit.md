# Yansa site audit (old site, `main` @ 2e3c144)

Branch for this rework: `restructure-v2` (from `main`). Audited 24 Nov 2026.

How scroll was measured: each page loaded in a 1440 x 900 frame (desktop) and a 390 x 844 frame
(phone), total document height read after the scripts ran. "Screens" = height / viewport height.
Pinned scroll sequences count at their full runway, because that is what the visitor scrolls.

## Scroll length per page

| Page | Desktop px | Desktop screens | Phone px | Phone screens | Verdict |
|---|---|---|---|---|---|
| YanQ (`yanq.html`) | 12,405 | **13.8** | 7,522 | **8.9** | Worst. "How YanQ Works" alone is 10,004 px (11 screens) on desktop, 5,031 px on phone |
| Home (`index.html`) | 6,202 | 6.9 | 5,935 | 7.0 | Long. Pinned hero is 2,521 px (2.8 screens) |
| Solution (`solution.html`) | 6,033 | 6.7 | 7,564 | **9.0** | Long on phone: the Problems stack is 1,654 px, Offered grid 1,194 px |
| PQ Solved (`pq-solved.html`) | 4,502 | 5.0 | 5,262 | 6.2 | OK |
| About (`about.html`) | 4,441 | 4.9 | 4,223 | 5.0 | OK |
| Contact (`contact.html`) | 2,418 | 2.7 | 2,743 | 3.3 | OK |

Site-wide: the footer is 601 px on desktop but **1,139 px (1.35 screens) on phone**, on every page.

## Per page: sections, purpose, issues

### Home (6.9 screens)
1. **Hero** (2,521 px, pinned): looping film shrinks into a card, four photos spread round it, then
   "We Measure What Others Miss." Signature piece of the old site. Sanya: drop the video (not smooth).
   The runway is longer than the story needs.
2. **Precision starts with Diagnosis.** (900 px): one paragraph + CTA. Sanya: add a sub point on the
   team (doctorates in power electronics, engineers and associates).
3. **Symptoms precede failure. Always.** (941 px): four symptom cards with icons. Sanya: the visuals
   should show what each failure actually means. Icons are generic.
4. **Quote** (430 px): pull quote, scroll-revealed. Fine.
5. **Why Yansa?** (720 px): Measure / Solve / Support cards. Sanya: make them links
   (Measure > YanQ, Solve > Solutions, Support > Services). Today they are dead ends.
6. Case studies: hidden (no real content yet). Leave hidden.

### About (4.9 screens)
1. Hero "REFINING POWER" (photo).
2. Statement: "Once your problem is solved, our team stays to support you..."
3. **We Measure. / Solve. / Support.** (cycling word). Sanya: move it to second place, right after the hero.
4. **Our Values** (pinned panel). Sanya: remove.
5. **Industries We Serve** (3 tabs). Sanya: add the Hammond-style industry list (12 items).
6. **FAQs** (5 items). Sanya: add "What is power quality?", "Why is it important?" (downtime,
   equipment failure, bill penalties), "How is Yansa different from others?" (not "contractor"),
   "Does Yansa deal in hybrid panels?" (yes, system integrator); remove the pricing question and the
   last question.

### Solution (6.7 desktop, 9.0 phone)
1. Hero "The Right Solution Starts Here." Sanya: remove "That is how Yansa works."
2. **Solutions We Offer** (4 columns: Active, Passive, Hybrid, Services). Sanya: "Solutions" in cyan,
   not "Offer"; no red on "Active"; the items should look clickable.
3. Team statement (doctorates, 40+ IEEE publications). Sanya: move it right under the hero title.
4. Loads Responsible for PQ Problems (5 animated load cards + CTA card).
5. The Problems These Loads Create (3 stacked cards, sticky). 1,654 px on phone.
6. Now see it solved (fan of 3 glimpse cards into PQ Solved).
7. What Inaction Costs (3 photo cards).
8. Results (hidden).
Sanya: everything from 4 onwards moves to a separate "PQ issues / loads" page.

### PQ Solved (5.0 screens)
1. Grid hero "PQ Solved." + "Distortion in, clean power out..." Sanya: this is the page the Solutions
   menu should open, renamed "Solutions"; replace the line with a distorted-to-clean wave graphic.
2. Marquee: problem > fix strip.
3. **Match the fix to the problem** (4 cards). Sanya: move to the loads page.
4. Sticky jump bar + product rows: Active (3), Passive (3), Hybrid (2, text only, no photos),
   Services (AMC, Commissioning). Each card expands for detail.

### YanQ (13.8 desktop, 8.9 phone)
1. Photo hero "YanQ" + "Measure First. Solve Right." + "A structured Power Quality study."
   Sanya: remove "Measure First. Solve Right."
2. What is YanQ ("The Study Before the Solution") + CTA.
3. **How YanQ Works**: one pinned sequence, 11 screens. Intro quote reads along, stage turns petrol,
   four steps scroll past with a process diagram each, then the title morphs into "What YanQ
   Delivers". Sanya: make it simple, visual and navigable like "What YanQ Delivers": boxes with
   arrows, no long text. This section is the main scroll problem on the whole site.
4. What YanQ Delivers (4 icon stats). Good, and the model Sanya points to.

### Contact (2.7 screens)
Hero "Let's Begin With a Diagnosis." + map + form. Sanya: heading "Your Facility. Our Solution."
(drop "Tell us").

## Site-wide findings
- **Menu** is Home, About Us, Solution, YanQ, Contact. Agreed new menu: Home, About Us, Solutions,
  Services, Know Your Loads, Contact, with drop-downs under Solutions and Services.
- **Menu wraps to two lines** at about 960 px window width (seen in Chrome at 958 px). With six items
  plus drop-downs this gets worse, so the nav needs a tighter breakpoint.
- **Phone footer** is 1.35 screens tall on every page.
- **Hybrid panels** have no photos (text-only cards). Best available stand-ins: `images/products/apfc-relay.jpg`,
  `svg-plus.jpg`. Real photos still open with Yansa.
- **Tone**: Sanya asks for a collaborative tone ("we offer"), never "command" or "mandate".
- Content that already exists and is good: product copy on PQ Solved, the load explorer copy and the
  Services copy written on `client-revamp-nov`, the revised FAQ answers on `client-revamp-nov`.

## What went wrong on `client-revamp-nov` (why we are not building on it)
- New Services and Solutions pages used the PQ Solved grid hero and new card styles, so the site lost
  the photo-hero rhythm and the old section look.
- Load page stacked five sections that say the same thing twice (explorer, load cards, problems,
  match-the-fix, see-it-solved) and is long.
- YanQ and "Power Quality Study" were shown as two separate services, while the site's own FAQ says
  YanQ *is* the power quality study. Confusing.
- The YanQ scroll problem was not fixed.
