# Phone-view audit (S15, 2026-11-24)

Measured at 390x844 and 360x780 (headless mobile emulation, scrolled in steps so the scroll-linked reveals run;
computed styles read from every visible text node; tool: scratchpad `phone/inventory.mjs`). Know Your Loads is
out of scope (Shrey: it gets its own redesign); shared token changes may still reach it and are listed at the end.

No horizontal overflow on any page at 390 or 360. The menu (fixed in S14 J) and the footer (S14) are fine.
The problem is the **type scale**: the phone layer has a token scale in `css/m/base.css`, but sections multiply it
with local `--fs-scale` values (About 1.12/1.08/1.45/1.4/0.92, Home 1.1/1.5/1.2, Contact and Services 1.05,
Solutions 1.08) or put a heading on the wrong tier. Result at 390: **eleven different heading sizes** for what is
one role (section heading: 66, 44, 42, 40.6, 38, 35.7, 34, 31.9, 29, 25.9, 24 px) and three body sizes in About
(19.8, 18.7, 17.6 px against 16 everywhere else).

## 1. Phone scale (tokens), applies at <= 599 px only

All type comes from these tiers; no section multiplies them on phone (`--fs-scale: 1` everywhere <= 599 px).
Values are `390 px / 360 px` (clamped on vw).

| Tier | Size | Line-height | Used for |
|---|---|---|---|
| Display | 44 / 40 | 1.05 | the one page-opening title on Home hero, Solutions hero, YanQ hero intro ("YanQ"), Home "Diagnosis." word |
| H1 | 34 / 31 | 1.12 | inner hero titles (About "REFINING POWER", Services, Contact, legal), YanQ "Study Before the Solution.", About "We Measure." |
| H2 | 29 / 27 | 1.15 | every section heading (FAQs, Industries, How YanQ Works, What YanQ Delivers, Why Yansa, footer CTA...) |
| Statement | 24 / 22 | 1.32 | Home quote, About and Solutions statement text |
| H3 | 22 | 1.2 | block titles (Services blocks, Solutions family "Active Solutions" sub-heads) |
| H4 | 20 | 1.25 | card titles |
| Numeral | 40 / 36 | 1 | stat figures ("40+", "PhD", "519") |
| Lead | 17 | 1.55 | hero sub-lines, section intros |
| Body | 16 | 1.6 | paragraphs, FAQ answers, buttons |
| Small | 14 | 1.5 | card text, captions, footer |
| Label | 13 | 1.4 | uppercase eyebrows, form labels |

Headings get `text-wrap: balance`, paragraphs `text-wrap: pretty` (kills widows such as "rest.", "Miss.").

Spacing (<= 599 px): section padding **64 / 64** (heroes 0; same-colour follow-on bands 48); heading to body
**12-16**; body to first CTA **24-28**; heading block to cards/list **28-32**; stacked buttons gap **12**.
Buttons: height **48**, text 16, side padding 24 (shapes and colours unchanged). Floating bar 52 high (unchanged).
Tap targets: every control's hit area >= 44x44 (the visible dot or link may stay smaller; pad the hit area).

## 2. Findings, ranked by impact

| # | Page / section | Problem | Fix (size) |
|---|---|---|---|
| 1 | Home / Diagnosis | "Diagnosis." is 66 px (display x1.5), the heaviest type on the site; dwarfs the hero title | Display tier 44, no scale; "Precision Starts with" stays H2 29 |
| 2 | About / FAQ | "FAQs" heading 40.6 px (x1.4), answers 17.6, questions 18.4 | H2 29; questions Body+1 = 17; answers Body 16 |
| 3 | About / Measure | "We Measure." 42 px; body 19.8 px | H1 34; body Lead 17 |
| 4 | About / Industries | heading 31.9; lead 18.7; tab labels 17.6 | H2 29; Lead 17; tabs 16 |
| 5 | About / Hero | "REFINING POWER" uppercase 38 px runs edge to edge (24 px margins) | H1 34 (still uppercase) |
| 6 | YanQ / Hero | "Study Before the Solution." 44 px (display) on top of the 44 px "YanQ" title one screen above | H1 34 |
| 7 | YanQ / Works + Delivers | section headings 34 px vs 29 elsewhere | H2 29 |
| 8 | Home / Quote | 28.8 px quote, 10 lines, a wall of type | Statement 24 (~8 lines) |
| 9 | Solutions + About / Statement | statement text 25.9 px | Statement 24 |
| 10 | Solutions / Statement | ~190 px empty band between the typed line and the stats (space reserved for the typing) | reserve only the full text's height; gap text -> stats 40 |
| 11 | Solutions / Stats | "40+", "PhD", "519" 48 px bold, heaviest block on the page | Numeral 40 / 36 (weight kept) |
| 12 | Services + Contact / Hero | h1 35.7 (x1.05) | H1 34 |
| 13 | Services / blocks, Solutions / families | block titles 24 px; equal to some section headings | H3 22 |
| 14 | Home / Symptoms | deck cards ~330 px tall with a ~140 px empty middle between icon and title | card height from content; icon-to-title gap 32 |
| 15 | Legal pages | 136 px top padding (nav + 72) leaves a blank band above the title | nav height + 40 top, 64 bottom |
| 16 | Section rhythm | padding varies 32-150 px: Home diagnosis 72, quote 80; About 72/64; Solutions statement 44, offered 36/64, next 40; Services svc 48/56, flow 44/52; YanQ expect 32 | 64/64 everywhere (Solutions hero keeps its wave room; same-colour bands 48) |
| 17 | Tap targets | Home symptom dots 32x44; Solutions product dots 26x32 (x8); Solutions family tabs 113x40; Home "Know Your Loads ->" 145x17 | hit areas 44x44 / 44 high, visuals unchanged |
| 18 | 404 | four stacked 52 px buttons read as a heavy block | buttons 48, gap 12 |
| 19 | YanQ / Delivers | 2-column cards: 64 px icon tiles leave ~130 px text columns at 14 px | icon tile 48, card padding 16, keep 2 columns |
| 20 | Contact / body | form copy 14x1.05 | Small 14, no scale |
| 21 | All | widows in headings and short paragraphs | text-wrap balance / pretty |

Not changed (by design or out of scope):
- Home: the floating "Book a Diagnosis" bar passes over the "Which loads cause these? Know Your Loads" line while
  scrolling. Content always scrolls under a floating bar; it is never covered at rest (the bar hides over the
  footer CTA). No fix.
- Home "We Measure What Others Miss." centred 6-line paragraph: centring is the old design; kept.
- Contact: the site's "Open in Google Maps" pill sits over Google's map credits strip; minor, kept.
- Button shapes (pill vs 6 px radius) differ by context, as on desktop; kept.

## 3. Shared changes that also reach Know Your Loads
`css/m/base.css` tier tokens (Numeral 40/36, line-heights, text-wrap) and the button height apply to KYL too.
KYL's own CSS/JS is not touched.
