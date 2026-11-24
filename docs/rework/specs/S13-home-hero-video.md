# S13 Home: hero video back                                    status: FROZEN 2026-11-24

Goal: the Home hero plays the old site's video again, exactly as `main` @ 2e3c144 had it. The still
(`images/hero-poster.jpg`) was a stand-in. Shrey overrides the sitemap line that removed the video.

## Build
1. Restore from `git show 2e3c144:index.html` the hero `<video>` element (autoplay muted loop playsinline
   preload, poster `images/hero-poster.jpg`, sources `videos/hero-1920.mp4` at >= 1400 px and `videos/hero-1280.mp4`
   otherwise, aria-hidden, width/height) and its comment, in place of the current still `<img>` in the hero.
2. Restore the old video JS (`initHeroVideo` and any reduced-motion pause / visibility pause / data-saver logic) from
   `git show 2e3c144:js/script.js`, and the old phone handling from `git show 2e3c144:js/m/home.js` and
   `css/m/home.css` (whatever the old site did on phones: same file, poster only, or pause). Same CSS for the video
   element (object-fit, position) from `2e3c144:css/style.css`. Diff old vs current for the hero to find every
   piece; do not invent new behaviour.
3. Keep the current S6 hero choreography (stages, text, card photo `images/hero-panel.jpg`) and the shorter pinned
   runway (desktop 1,621 px, phone 1,286 px). Remove the still's slow 1.06 -> 1 scroll scale only if it was added for
   the still and fights the video; otherwise keep it. Compare old (2e3c144 on a temporary port from `git archive`,
   stop it after) vs new at the same 12 scroll stops used in S6 (1440 / 1024 / 390) and judge whether the
   choreography still reads with the video at the shorter runway. If it does not, do NOT lengthen it: report what it
   needs (e.g. runway px) and stop.
4. Reduced motion: the video is paused on its poster (as the old site did). No console errors, no failed requests
   (the mp4s must load from `videos/` under the local server).
5. `videos/` stays. Update `AGENTS.md` open items (videos are used again) — FRIDAY updates sitemap/progress.

## Out of scope
Other Home sections, other pages, the S6 symptom/why work, page length beyond the hero.

## Acceptance checks
1. `index.html` hero has the `<video>` with both sources and the poster; `links.mjs --strict-img` passes (video
   sources resolve).
2. Headless 1440: video `readyState >= 2` and `currentTime` advancing after 2 s; 390: matches the old site's phone
   behaviour (state it).
3. Reduced motion: paused on the poster.
4. Old-vs-new stops compared; shots in `scratchpad/shots/s13-r1` and `s13-r2`; one-line verdict on the runway.
5. `measure.mjs index.html`: heights unchanged from now (desktop 5,073 +- S10 changes), 0 console errors, 0 failed.
6. `node --check` on touched JS.

## Hard gates
Same as 00-common; preview server on 8765 left running; any temporary server you start is stopped; trailer exact.
