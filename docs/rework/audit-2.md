# Audit 2: visual and logical (2026-11-24)

Scope: every page at 1440, 820, 600 and 390 px (600 covers the 391-768 range the first round missed), reduced
motion at 1440 (index, yanq, know-your-loads), page outlines (titles, meta, headings, CTAs and where they lead),
in-content links per page, naming counts across pages. Reviewers: FRIDAY (logic, reduced motion, spot checks),
two VISION passes on screenshots (`scratchpad/shots/audit2/`). Visual findings from one-pass screenshots were
verified before fixing (several were capture timing).

Status key: **APPLIED** (built in S10 or S9), **DECIDE** (for Shrey; changes structure, key copy or is L),
**NOTED** (low impact, no action proposed). Size S/M/L.

## Ranked findings

| # | Page / section | Problem | Proposed fix | Size | Status |
|---|---|---|---|---|---|
| 1 | Contact (and the whole site) | No email, phone or written address anywhere: the contact page is a map and a form. A plant manager with an urgent problem cannot call. The form's error text says "email us directly" with no email shown. | Add email, phone (and WhatsApp) and a one-line address beside the form and in the footer once Yansa confirms them. Error text changed now (S10 F5). | S once data arrives | DECIDE (needs data) + error text APPLIED |
| 2 | Home > YanQ > Contact | One CTA label, two destinations: Home's "Start With a Diagnosis" goes to the YanQ page; YanQ's "Start With a Diagnosis" goes to the contact form. "Book a Diagnosis", "Contact Us", "Start With a Diagnosis", "Discuss a similar problem" all lead to the same form. | One system: primary "Book a Diagnosis" always goes to the contact form; anything that goes to YanQ says so ("See how YanQ works"). Home's Diagnosis button becomes "See how YanQ works". | S | DECIDE (CTA copy) |
| 3 | Nav drop-downs | Plain cream box with three text links. | Two-zone panel: icon + title + one-line description per item, sliding highlight, caret, featured tile (Know Your Loads / How an engagement runs). | M | APPLIED (S9, 2 UI rounds) |
| 4 | Contact form | Only name, email, company, message. No phone, no "what do you need". Leads arrive without a way to call back or triage. | Add Phone (optional) and "I'm interested in" (YanQ study / A solution / Commissioning / AMC / Not sure). Sheet columns need adding on the receiving side. | M | DECIDE |
| 5 | Home | 5.64 screens desktop vs target 5 (4,500 px; now 5,073). Sections: hero runway 1,621, diagnosis 586, symptoms 1,056, quote 430, why 690. | See decision D1: symptoms as one 4-across row at >= 1200 px (~-450 px) and quote band padding to the 96 px rhythm (~-100 px) gives ~5.0 with every section kept. | M | DECIDE |
| 6 | YanQ | The first question of a buyer (how long, what you need from the plant, what you get, roughly what it costs) is not answered anywhere. | A short "What to expect" row (duration on site, access needed, report turnaround, deliverable) under How YanQ Works. Needs Yansa's facts. | M (content) | DECIDE |
| 7 | YanQ | Two CTA bands back to back at the end ("Know what your power system is doing..." then the footer's "Solve before problems become expensive."). | Drop the page's own band, or move its two buttons into the footer band on this page only. | S | DECIDE (removes a section) |
| 8 | About | Zero in-content links: the page is a dead end apart from the footer. | Link existing words in the FAQ answers to YanQ, Solutions, Services and #hybrid (no copy change). | S | APPLIED (S10 F4) |
| 9 | Phone, all pages | The floating "Book a Diagnosis" pill covers the last lines of content and the footer end. | Footer bottom clearance; hide the pill while the footer CTA band is in view. | S | NOT REPRODUCED: the pill already hides over CTA bands and the footer (S10 V1) |
| 10 | About, Industries tabs, 391-768 | Tab row cut mid-word with no scroll cue. | Edge fade while more tabs are off-screen, scroll snap. | S | APPLIED: fade already existed; scroll snap added (S10 V2) |
| 11 | Solutions, sticky chips | Jumps (from the nav panel and chips) can land with the heading under the sticky chip bar. | `scroll-margin-top` on section and card anchors. | S | APPLIED (S10 V5) |
| 12 | Solutions, About statement blocks | Typewriter blocks reserve more height than the final text: an empty cream band. | Trim reserved height to the final text. | S | NOT REPRODUCED (shot was mid-typing). At 1440 the block keeps its 60vh min-height, centred: trimming it is a taste call (S10 V3) |
| 13 | Index 769-1024 | Symptoms / Why cards may run single-column and stretched. | Desktop column pattern at that range. | M | APPLIED: Symptoms 2 columns, Why 3 columns from 769 px (S10 V7) |
| 14 | Contact | Map and form columns end at different heights (1440); map is a thin strip at 391-768. | Stretch to match; 320 px min at phone. | S | 1440 NOT REPRODUCED (equal heights); phone map min 320 px APPLIED (S10 V8) |
| 15 | Heroes (Contact, Know Your Loads) | One-word last lines in subtitles ("...it from there."). | `text-wrap: balance`. | S | APPLIED (S10 F1) |
| 16 | Index / About heroes, 481-768 | Subtitle wraps into a narrow lonely column under a wide title. | 34ch max width at that range. | S | APPLIED (S10 V6) |
| 17 | Spacing at 391-768 | Extra cream under home intro buttons (~160 px), under the 404 buttons (~230 px), tight gap under the loads explorer. | Bring to the section rhythm. | S | APPLIED (S10 V9, V10, V13) |
| 18 | YanQ hero, 391-768 | Subtitle contrast borderline on the panel photo. | Deepen the existing overlay. | S | NOT REPRODUCED: >= 11.3:1 measured (S10 V11) |
| 19 | SEO titles | "Solutions \| Yansa", "Services \| Yansa", "Know Your Loads \| Yansa" carry no search terms. | Descriptive titles (S10 F7). Meta descriptions and canonical/OG already pass `check-head.mjs`. | S | APPLIED |
| 20 | Accessibility | About hero H1 typed in capitals (read letter by letter); About "We Measure." heading's name is only "We". | Capitals via CSS; hidden "Measure." text. | S | APPLIED (S10 F2, F3) |
| 21 | Naming | Solutions page's Services column lists Commissioning, AMC, YanQ; the nav lists YanQ, Commissioning, AMC. | Same order as the nav. | S | APPLIED (S10 F6) |
| 22 | YanQ, What YanQ Delivers | Card title "Benchmarking+" (carried over from the old site). Looks like a typo, or a "+" meant as "and more". | "Benchmarking" (or tell us what the + means). | S | DECIDE (client copy) |
| 23 | Real photos needed from Yansa | Power Capacitors photo has certification logos and a white box baked in; Hybrid panel photos are stand-ins (`apfc-relay.jpg`, `svg-plus.jpg`); Services photos `service-amc.jpg` and `service-commissioning.jpg` were AI-generated in October. Nav tiles `images/nav/feature-loads.jpg` and `feature-services.jpg` are crops of the existing `solution-hero.jpg` and `hero-plant.jpg` (not generated). Rule (Shrey, 2026-11-24): no image generators unless he says so; existing or Yansa-supplied images only. | Ask Yansa for a clean capacitor cut-out, real hybrid panel photos, and real commissioning and AMC site photos. | S | DECIDE (needs assets) |
| 24 | Services | Commissioning and AMC blocks have no direct "ask about this" action; the only route is the footer band. | A small "Ask about commissioning" / "Ask about an AMC" link to the contact form. | S | DECIDE (copy) |
| 25 | Home | (Closed) Case studies. | Shrey: there is no case study and none will be added. Hidden section, footer links, CSS and JS deleted in S14. | - | CLOSED |
| 26 | Solutions product grids, 1440 | Three cards sit left in a four-column grid (Hybrid two), leaving a right gutter. This is the old site's grid. | Keep (identity). | - | NOTED |
| 27 | Services, Learn More | First "Learn More" is a link (arrow), the next two expand in place (chevron). The icons already tell them apart. | Keep. | - | NOTED |
| 28 | Know Your Loads, explorer | 16 H3s inside the tab panels (some repeated, e.g. "Active harmonic filter" twice) make a noisy heading outline. | Could become H4 / styled paragraphs; low value. | S | NOTED |
| 29 | Know Your Loads, problems deck (phone) | Next card is dimmed as a peek. | Intended swipe-deck cue; keep. | - | NOTED |

Checked and fine: titles and descriptions unique, canonical/OG/JSON-LD valid (`check-head.mjs`), internal links and
anchors (`links.mjs --strict-img`), nav/footer identical across pages, reduced motion shows complete content
(no empty bands, the Know Your Loads fan stacks cleanly), heading order H1 > H2 > H3 on every page, one H1 per page.
YanQ naming is consistent ("YanQ Power Quality Study" in nav, services, solutions; "YanQ study" in running text).

## Added during the round (Shrey's asks via JARVIS)

- S11 Solutions: team statement is now a petrol band with three figures (40+ IEEE publications, PhD, 519); the
  offered block is a 2x2 grid so no chip label wraps or clips at >= 1280 (it was 4 columns). Desktop 5.46 screens.
- S12 Services: engagement row lights up to the hovered/focused step; on phones it fills once in view.
- S13 Home: the old hero video is back on the same choreography and the 1.8-screen runway.

## Shrey's decisions (2026-11-24) and outcome
Built in S14: D1 (4,807 px, 5.34 screens: target ~5.0 not fully met, see handoff), D2, D4 (Apps Script redeploy
open), D5, D6, D7, D9. Not built: D3 and D8 (Shrey handles with Yansa, still open). D10 closed: no case study.

## Decisions for Shrey (with recommendation)

D1. Home length (5.64 screens, target 5). **Recommend:** symptom cards as one row of four at >= 1200 px (the
    line drawings and hover stay; ~-450 px) and the quote band on the 96 px rhythm (~-100 px): about 5.0 screens,
    nothing removed. Alternative: accept 5.64; the hero runway is pinned motion, so it scrolls faster than it reads.
D2. CTA system (finding 2). **Recommend** the one-system rule; Home's diagnosis button becomes "See how YanQ works".
D3. Contact details (finding 1). **Recommend** asking Yansa for email + phone/WhatsApp + address now; it is the
    biggest gap for a visitor in trouble.
D4. Contact form fields (finding 4). **Recommend** yes; small change, better leads.
D5. YanQ "What to expect" row (finding 6). **Recommend** yes, with Yansa's facts (no invented durations).
D6. YanQ double CTA band (finding 7). **Recommend** drop the page's own band and keep the footer band.
D7. "Benchmarking+" (finding 22). **Recommend** "Benchmarking".
D8. Product photos (finding 23). **Recommend** ask Yansa for a clean capacitor photo and real hybrid panel photos.
D9. Services "Ask about" links (finding 24). **Recommend** yes.
D10. Closed: no case study (Shrey, 2026-11-24).
