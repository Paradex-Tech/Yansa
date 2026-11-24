# S9 Nav drop-down panels                                  status: FROZEN 2026-11-24

Goal: hovering, focusing or tapping the chevron of Solutions or Services opens a richer, well-crafted panel that
reads as one system across both menus, instead of the plain cream box with three text links.

Shrey's words: "The work is really good." The drop-down box is plain; he wants "something better there".

## Reference (studied by FRIDAY)
- Stripe / Linear / Vercel nav panels: icon tile + title + one-line description per item, one shared hover
  highlight that slides between items, a small caret pointing at the trigger, a quick fade-and-rise open.
- Powerside (industrial PQ peer): each menu opens with a short intro and a "view all" link per group.
- Combined here: a two-zone panel (item list + one featured tile), in the site's own tokens, not a SaaS look.

## Design (build exactly this)
Panel (desktop >= 769 px), both menus identical in structure:
1. **Item list (left zone)**, 3 rows. Each row is one `<a>`: a 40x40 icon tile (radius 8px, background
   `rgba(52,182,175,0.12)` i.e. --teal at 12%, icon stroke `var(--teal-deep)`, 1.6 stroke, 20px inline SVG drawn in
   the same line hand as the site's icons; on row hover/focus the tile turns `var(--teal-deep)` and the icon
   `var(--ivory-card)`), then a text block: title (`.nav-menu__title`, Body tier, colour `var(--ink)`, existing nav
   weight) and a one-line description (`.nav-menu__desc`, Small tier, colour `var(--text)`). Row padding 12px,
   radius 8px. A small arrow (the site's arrow style) fades in and nudges 3px right at the row's end on hover/focus.
2. **Sliding highlight**: ONE absolutely positioned element (`.nav-menu__glow`, background `var(--cream)`, radius
   8px) behind the rows that moves with `transform: translateY()` and sets its height to the hovered/focused row
   (height set once per row via a CSS variable is fine; animate transform + opacity only, 220ms
   cubic-bezier(.2,.7,.2,1)). It fades out when the pointer leaves the list. Reduced motion: no slide, it just
   appears on the row.
3. **Featured tile (right zone)**, 200-220px wide, full panel height, radius 8px, a photo with the petrol overlay
   language of the photo heroes (petrol gradient from bottom, cream text): eyebrow (Label tier, `var(--mist)`),
   title (H4 tier is too big; use Lead tier, `var(--text-on-dark)`), one short line, and "->" link text. The whole
   tile is one `<a>`. Hover: photo scales 1.04 over 400ms, arrow nudges.
   - Solutions tile: eyebrow "Not sure which fits?", title "Know Your Loads", line "See which loads cause which
     problems, and the fix for each.", href `know-your-loads.html`, photo `images/solution-hero.jpg` cropped.
   - Services tile: eyebrow "How we work", title "How an engagement runs", line "Measure, report, solve,
     commission, support.", href `services.html#flow` (add `id="flow"` to the `.svc-flow` section on
     services.html), photo `images/hero-plant.jpg` cropped.
   - Make small crops with Python PIL (installed): `images/nav/feature-loads.jpg` and `images/nav/feature-services.jpg`,
     440x520 (2x of the tile), quality 80, target < 60 KB each. Give `<img>` width/height, `alt=""` (decorative;
     the link text names the destination), `loading="lazy"` is NOT used (panel images must be ready on first hover).
4. **Item copy** (titles unchanged, descriptions new, drawn from each page's own copy):
   - Active Solutions: "Electronics that measure and correct in real time." (`solutions.html#active`)
   - Passive Solutions: "Fixed components for steady, predictable loads." (`solutions.html#passive`)
   - Hybrid Solutions: "Active and passive stages in one panel." (`solutions.html#hybrid`)
   - YanQ Power Quality Study: "We measure your loads, then offer the right fix." (`yanq.html`)
     The word "YanQ" keeps the site's YanQ name treatment if one exists in nav context; otherwise plain text.
   - Commissioning Support: "Every panel proven before handover." (`services.html#commissioning`)
   - AMC: "Scheduled care, year after year." (`services.html#amc`)
   Icons (simple, recognisable at 20px): Active = a sine wave with a small lightning/pulse; Passive = capacitor
   symbol (two plates); Hybrid = the two combined (wave over plates) or two linked squares; YanQ = a magnifier over
   a wave (or reuse the shape language of `images/icons/yanq-analyser.svg`); Commissioning = a check inside a
   shield or a panel with a tick; AMC = a calendar with a circular arrow.
5. **Panel shell**: background `var(--ivory-card)`, 1px `var(--line)` border, radius 12px, shadow
   `0 24px 48px rgba(26,65,70,0.14), 0 2px 6px rgba(26,65,70,0.06)`, padding 8px, gap 8px between zones. Width:
   list zone ~300-320px + tile. A **caret**: a 12px rotated square on the panel's top edge (same fill and border,
   border only on its top-left sides), horizontally centred on the trigger (label + chevron) via a CSS variable
   `--caret-x` that JS sets.
6. **Position**: the panel opens below the bar, with a top gap of ~10px for the caret. It stays inside the viewport
   with a 16px margin at every width from 769 to 1920: JS measures on open and sets a shift variable (`--menu-x`);
   the caret keeps pointing at the trigger. Must never cause horizontal scroll. The hover bridge from trigger to
   panel must have no dead gap (keep the existing 150ms close delay, and use a transparent ::before bridge).
7. **Motion**: open = opacity 0->1, translateY(8px)->0 and scale .98->1 (transform-origin at the caret),
   200ms cubic-bezier(.2,.7,.2,1); rows and tile stagger in 30ms apart (opacity + 4px rise). Close = 140ms fade, no
   stagger. Chevron rotation kept. Reduced motion: no transform, no stagger, instant show/hide.
8. **Tablet 769-1000 px**: same panel, the featured tile may shrink (170px) or drop below the list as a short
   horizontal tile; descriptions must not wrap to more than 2 lines. The top bar must stay one row with no
   overlap at 769, 800, 900, 1000, 1100, 1280, 1440 (shots.mjs `--nav` ONE_LINE check).

Accessibility (keep everything that works today in `initNavMenus`):
- Hover opens (desktop only), keyboard focus-visible opens, chevron button toggles with `aria-expanded`, Escape
  closes and returns focus to the chevron, outside click closes, choosing a child closes.
- Add: ArrowDown on the chevron when open moves focus to the first row; ArrowUp/ArrowDown move between rows and the
  tile; Home/End optional. Focus ring stays visible (`2px solid var(--teal)`). The sliding highlight follows focus.
- Panel stays a plain list of links (no `role="menu"`; it is disclosure navigation).
- `aria-current="page"` child: title in `var(--teal-deep)` and its icon tile filled teal-deep.

Phone menu (<= 768 px, `js/m/base.js` `buildMenu`):
- It builds sub-links from `.nav-menu a` using `textContent`. Change it to read only `.nav-menu__title` (and skip
  the featured tile: mark it `data-nav-feature` and exclude it), so the phone menu looks EXACTLY as today.
- The CSS fallback block for <= 768 px in `css/style.css` (~line 980-1010) must hide descriptions, icons, glow,
  caret and the tile, so the no-JS phone list is unchanged too.

## In scope
The nav markup in all 10 pages (index, about, solutions, services, know-your-loads, yanq, contact, 404,
privacy-policy, terms: identical apart from active state), `css/style.css` nav section + section 3 tier selectors,
`js/script.js` `initNavMenus`, `js/m/base.js` `buildMenu` (title read only), `services.html` `id="flow"`,
two new images in `images/nav/`.

## Out of scope (must NOT change)
Top bar layout, item order, labels, the sliding underline indicator, CTA button, logo, the phone menu's look and
motion, any page section. No new fonts, no libraries.

## Acceptance checks
1. `node docs/rework/tools/check-nav-footer.mjs` passes (nav identical across pages) and `links.mjs --strict-img`
   passes (new hrefs and images resolve, `#flow` exists).
2. `node --check js/script.js js/m/base.js`.
3. `shots.mjs s9 --nav` at 1440, 1280, 1100, 1000, 900, 800, 769: one row, no overlap, no wrap, scrollWidth ==
   viewport; each panel open shot shows both zones fully inside the viewport, caret above its trigger.
4. Phone 390: the m-menu shows exactly the same rows and sub-link texts as before (compare the sub-link text list
   before/after in a script; e.g. "Active Solutions", not "Active Solutions Electronics that...").
5. Keyboard (headless CDP script or Chrome): Tab to Solutions chevron, Enter opens (aria-expanded=true), ArrowDown
   focuses first row, ArrowDown x3 reaches the tile, Escape closes and focus is on the chevron.
6. Reduced motion (`shots.mjs --reduced` or emulation): panel appears with no transform.
7. `measure.mjs`: no console errors, no failed requests on all pages; page heights unchanged.
8. Each new image < 60 KB.

## Hard gates
Checks 1-8; scope respected; commit trailer exact; no server stopped that you didn't start (the preview server on
8765, pid 17488, is FRIDAY's: leave it running and use it).

## Pre-mortem
- Phone menu shows descriptions inside sub-links -> check 4.
- Services panel overflows the right edge at 769-1100 -> JS clamp + check 3.
- The glow animates `top`/`height` and janks -> transform-only; height via variable set without transition.
