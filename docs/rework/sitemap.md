# Yansa sitemap v2 (for Shrey's approval)

Starting point: the old site (`main`). Same look: same fonts, colours, photo heroes, section styles and
scroll-linked motion. What changes is what sits on each page, in what order, and how long it is.
Copy and content from Sanya's round (`client-revamp-nov`) are reused where they are good; its layouts are not.

**Menu (fixed, 6 items):** Home · About Us · Solutions · Services · Know Your Loads · Contact,
plus the orange "Book a Diagnosis" button.
- Solutions drop-down: Active · Passive · Hybrid
- Services drop-down: YanQ Power Quality Study · Commissioning Support · AMC
- On the YanQ page the "Services" item shows as active.
- The menu must fit on one line down to tablet width (today it wraps at about 960 px).

**Scroll targets** (desktop / phone screens; old figures in brackets):
Home 5 / 6 (6.9 / 7.0) · About 4.5 / 4.5 (4.9 / 5.0) · Solutions 5.5 / 7 (6.7 + 5.0 over two pages) ·
Services 3.5 / 4.5 (new) · Know Your Loads 6 / 7 (new) · YanQ **4.5 / 5 (13.8 / 8.9)** · Contact 2.7 / 3.3.
Phone footer cut from 1.35 screens to under 1 on every page.

---

## 1. Home (`index.html`)

| # | Section | What it shows | Why here / what changed |
|---|---|---|---|
| 1 | Hero | "Engineering Power Quality", the same shrink-to-card move with the four photos, then "We Measure What Others Miss." + Explore Solutions / Contact Us | Keeps the old signature. ~~Video removed~~ **Video back** (Shrey, 2026-11-24, overrides Sanya's ask): the old hero video plays the same choreography; the still was a stand-in. Pinned runway cut from 2.8 to about 1.8 screens |
| 2 | Precision starts with Diagnosis. | Same paragraph and CTA, plus a new line: a team of doctorates in power electronics, backed by engineers and associates | Sanya's sub point. One line, no new section |
| 3 | Symptoms precede failure. Always. | The four symptom cards, each with a small drawn animation of what the failure means: breaker tripping, motor running hot, bill meter climbing, efficiency gauge falling. Link: "Which loads cause these? Know Your Loads" | Sanya: more descriptive visuals. Links the reader into the new page |
| 4 | Quote | Same pull quote | Unchanged |
| 5 | Why Yansa? | Measure. Solve. Support. cards, now clickable: Measure > YanQ, Solve > Solutions, Support > Services | Sanya's links. Turns the three cards into the site's main paths |
| — | Footer CTA | "Solve before problems become expensive." | Unchanged; shorter on phone |

No Case Studies section (Shrey, 2026-11-24: there is none and none will be added; markup and CSS deleted in S14).

## 2. About Us (`about.html`)

| # | Section | What it shows | Why / what changed |
|---|---|---|---|
| 1 | Hero | "REFINING POWER" photo hero | Unchanged |
| 2 | We Measure. Solve. Support. | The cycling-word section | **Moved up to second** (Sanya) |
| 3 | Team statement | "Once your problem is solved, our team stays to support you..." | Was second, now third |
| 4 | Industries We Serve | Same tab component, 4 tabs with Sanya's list (below) | Sanya's Hammond list added |
| 5 | FAQs | 6 questions (below) | Sanya's edits |
| — | ~~Our Values~~ | | **Removed** (Sanya) |

Industries tabs (my wording, Sanya had no answer yet):
- **Industrial**: Automotive, Textiles, FMCG, Petro-chemical applications, Mining, Marine duty applications
- **Commercial & Healthcare**: Commercial infrastructure, Healthcare facilities, Hotels, Schools, Offices
- **Data Centres & Critical Infrastructure**: Data centres, Telecom, Power grid infrastructure, Power generation
- **Energy Transition** (replaces the unclear "Energy" tab): Renewable energy, Energy storage, EV charging, Microgrids
- "Power Quality" is **left out**: it is what Yansa does, not an industry.

FAQs, in order: What is power quality? · Why is power quality important? (downtime, equipment failure,
penalties on bills) · What exactly does Yansa do? · What is YanQ, and do I need one? · How is Yansa
different from others? · Does Yansa deal in hybrid panels? (Yes, we are a system integrator of hybrid
panels.) Pricing question and the old last question removed.

## 3. Solutions (`solutions.html`, replaces `solution.html` + `pq-solved.html`)

| # | Section | What it shows | Why / what changed |
|---|---|---|---|
| 1 | Hero | The PQ Solved grid hero, titled **"Solutions."**, with a wave that starts distorted and settles into a clean sine as the page loads and the pointer moves | Sanya: the Solutions menu opens the PQ Solved page, renamed; the graphic replaces "Distortion in, clean power out" |
| 2 | Problem > fix strip | The existing marquee (Harmonics > Active harmonic filter, ...) | Kept; thin, quick read |
| 3 | The Right Solution Starts Here. | Heading + the team statement (doctorates, 40+ IEEE publications) right under it | Sanya: team line under this heading; "That is how Yansa works" removed |
| 4 | **Solutions** We Offer. | The 4-column overview: Active, Passive, Hybrid, Services. Items styled as clickable chips that jump to the rows below; Services jumps to the Services page | Sanya: "Solutions" in cyan, no red "Active", items look clickable. Works as the page index, Powerside style |
| 5 | Sticky jump bar | Active · Passive · Hybrid | Kept from PQ Solved |
| 6 | Active Solutions | SVG, AHF, TSM cards (photo + expand) | Kept |
| 7 | Passive Solutions | Power capacitors, series reactors, line chokes | Kept |
| 8 | Hybrid Solutions | APFC panel, AHF panel, now with photos (stand-ins, see open items) | Kept; text-only cards get images |
| 9 | Not sure which one? | Short band: "Start with a YanQ study" + "Know your loads" links | Replaces the old Services row, which moves to the Services page |

## 4. Services (`services.html`, new)

| # | Section | What it shows | Why |
|---|---|---|---|
| 1 | Hero | Photo hero "Services." (plant photo) + one line: support that starts before the equipment and stays long after | Same photo-hero style as About, YanQ and Contact |
| 2 | Service blocks | Three wide blocks, alternating photo left / right (Powerside style: image, name, one or two sentences, Learn More): **YanQ Power Quality Study** (Learn More > YanQ page), **Commissioning Support**, onsite and online (Learn More opens the detail list in place), **AMC** (same) | Sanya's Services page. Order follows an engagement: study, commission, maintain |
| 3 | How an engagement runs | One thin row: Measure > Report > Solve > Commission > Support | Ties services to products in one glance; short |

**YanQ vs PQ Study (my call):** shown as one service, "YanQ Power Quality Study". The site already says
YanQ *is* Yansa's power quality study, and Sanya's latest deck lists three services (YanQ, Commissioning,
AMC). Two separate cards would look like two products for the same thing.

## 5. YanQ (`yanq.html`, kept, sits under Services)

| # | Section | What it shows | Why / what changed |
|---|---|---|---|
| 1 | Hero | "YanQ" photo hero + "A structured power quality study." | "Measure First. Solve Right." removed (Sanya) |
| 2 | What is YanQ | "The Study Before the Solution." + CTA | Unchanged |
| 3 | **How YanQ Works** | Four boxes joined by arrows: Measurement > Compilation > Report > Recommendations. Each box: its existing process drawing, the step name and a 3-6 word tag. Side by side on desktop, stacked with down arrows on phone. Drawings animate as they come into view. No pinned scroll | Sanya: simple, visual, like "What YanQ Delivers". **Cuts the page from 13.8 to about 4.5 screens** |
| 4 | What YanQ Delivers | The four icon stats | Unchanged |
| 5 | Next step | Two buttons: "See the Solutions" and "Book a Diagnosis" | Replaces the "Enter PQ Solved" button that lived in step 4 |

## 6. Know Your Loads (`know-your-loads.html`, new)

| # | Section | What it shows | Why |
|---|---|---|---|
| 1 | Hero | Photo hero "Know Your Loads." (switchgear photo freed from the old Solution page) | Same hero family |
| 2 | Load explorer | Three columns: **Loads > Problem > Yansa's Solution**. Pick a load (8 of them: drives, textile machines, welding and presses, UPS and servers, offices, furnaces, motors, paint shops) and the other two columns change. The animated load drawings from the old "Loads Responsible" cards appear in the Problem column | Sanya's column sketch. Merges the old load cards into it, so loads are not shown twice |
| 3 | The Problems These Loads Create | Harmonics, Power Factor, Voltage Instability | Moved from Solution. Shorter on phone (side-swipe cards instead of a 1,654 px stack) |
| 4 | What Inaction Costs | The three photo cards | Moved from Solution |
| 5 | Now see it solved | The old fan of glimpse cards, now carrying "Match the fix to the problem": Low power factor, High harmonics, Fast-changing loads (each > its Solutions row), Keeping it solved (> AMC). Button: "Enter Solutions" | Sanya moved Match-the-fix here. Merging it with See-it-solved avoids two sections that both say "here is the fix" |

## Old URLs

| Old URL | Goes to |
|---|---|
| `solution.html`, `/solution` | 301 > `solutions.html` |
| `pq-solved.html`, `/pq-solved` | 301 > `solutions.html` (`#active`, `#passive`, `#hybrid` still land on their rows; `#services` is forwarded to `services.html` by a small script) |
| `yanq.html` | Kept as is |
| `index.html`, `about.html`, `contact.html`, legal pages | Kept |
| `about.html#faq` | Kept |

`sitemap.xml` gets the three new pages and loses the two retired ones. Every internal link and the footer
columns are updated to the new pages.

## Contact (`contact.html`)
Unchanged apart from the form heading: **"Your Facility. Our Solution."** ("Tell us" removed).

## Site-wide
- Tone: "we offer", collaborative; no "command" or "mandate" anywhere.
- Footer link columns: Home, About, Solutions, Services / YanQ, Know Your Loads, Contact, FAQs / legal.
- Phone footer tightened.

## Open items (not blocking the build)
1. **Real hybrid panel photos** from Yansa. Stand-ins: `images/products/apfc-relay.jpg` (APFC panel) and
   `images/products/svg-plus.jpg` (AHF panel).
2. Red VFD light in the hero (Sanya marked it optional): skipped (decided when the video was out; the video is back as of 2026-11-24).
3. Wording I chose without Sanya: "YanQ Power Quality Study" as one service; "Energy Transition" tab;
   "Power Quality" dropped from industries.
4. (Closed 2026-11-24) No case studies: Shrey decided none will be added.
