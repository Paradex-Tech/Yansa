/* Phone behaviour: Know Your Loads
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation.

   Serves know-your-loads.html only. The load explorer's tabs, crossfade and
   chip row are the desktop script's (initLoadExplorer); this file adds the
   hero drift, the two swipe decks (Problems, Inaction) and the fan's
   scroll progress. Everything here is built by build() and taken apart by
   teardown(), so leaving the phone width (a rotation, a resized window)
   hands the page back to the desktop scripts with no classes, nodes or
   inline styles left behind. Scroll-linked values are pure functions of
   scroll position; time only drives the icon replay on the Problems deck. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }


  /* ---------- Helpers ---------- */

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  // Slow in, slow out: the curve every scroll-linked move here follows
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* Every listener, observer, timer and injected node registers its undo
     here; teardown() runs them all. */
  var undo = [];

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    undo.push(function () { target.removeEventListener(type, fn, opts); });
  }

  function inject(node, parent, before) {
    parent.insertBefore(node, before || null);
    undo.push(function () { node.remove(); });
    return node;
  }

  /* One rAF per scroll for every scroll-linked piece on the page. */
  var scrollers = [];
  var queued = false;

  function runScroll() {
    queued = false;
    scrollers.forEach(function (fn) { fn(); });
  }

  function queue() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(runScroll);
    }
  }

  function onScroll(fn) {
    scrollers.push(fn);
  }


  // Strips the reveal from cards that start off to the side of a deck: they
  // are clipped by the track, so the observer would only fire mid-swipe.
  function unreveal(items) {
    items.forEach(function (el, i) {
      if (i >= 2 && el.hasAttribute('data-reveal')) el.removeAttribute('data-reveal');
      else if (i < 2 && el.hasAttribute('data-reveal')) el.style.setProperty('--reveal-delay', i * 90 + 'ms');
    });
  }


  /* ---------- Snap carousel ----------
     The track is styled in css/m/loads.css; this adds the dots, marks the
     card in view, and writes each card's distance from the snapped position
     (--m-d, 0 to 1) so cards ease down as they leave. Snap positions are
     clamped to the track's end, so the last card counts as in view once the
     track cannot scroll further. */
  function carousel(track, opts) {
    opts = opts || {};
    var items = toArray(track.children);
    if (items.length < 2) return null;

    var dots = document.createElement('div');
    dots.className = 'm-dots' + (opts.light ? ' m-dots--light' : '');
    var buttons = items.map(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (opts.label || 'Card') + ' ' + (i + 1) + ' of ' + items.length);
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
      return b;
    });
    inject(dots, track.parentNode, track.nextSibling);
    unreveal(items);

    var snaps = [];
    var active = -1;
    var frame = null;

    function measure() {
      var pad = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
      var max = track.scrollWidth - track.clientWidth;
      snaps = items.map(function (item) {
        return Math.max(0, Math.min(max, item.offsetLeft - pad));
      });
      dots.hidden = max <= 1;
    }

    // Fractional index of the scroll position between the snap points
    function position() {
      var x = track.scrollLeft;
      if (x <= snaps[0]) return 0;
      for (var i = 1; i < snaps.length; i++) {
        if (x <= snaps[i]) {
          var span = snaps[i] - snaps[i - 1];
          return span > 0 ? i - 1 + (x - snaps[i - 1]) / span : i;
        }
      }
      return snaps.length - 1;
    }

    function update() {
      frame = null;
      var p = position();
      items.forEach(function (item, i) {
        item.style.setProperty('--m-d', Math.min(1, Math.abs(i - p)).toFixed(3));
      });
      var now = Math.round(p);
      if (now === active) return;
      active = now;
      buttons.forEach(function (b, i) {
        b.classList.toggle('is-active', i === now);
        if (i === now) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      if (opts.onActive) opts.onActive(items[now], now);
    }

    function go(i) {
      track.scrollTo({ left: snaps[i], behavior: reduce ? 'auto' : 'smooth' });
    }

    function refresh() {
      measure();
      active = -1;
      update();
    }

    on(track, 'scroll', function () {
      if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    on(window, 'resize', refresh);
    on(window, 'load', refresh);
    refresh();

    undo.push(function () {
      if (frame) cancelAnimationFrame(frame);
      items.forEach(function (item) { item.style.removeProperty('--m-d'); });
    });

    return { items: items, active: function () { return items[active]; } };
  }


  /* ---------- Hero: slow parallax ----------
     --m-par runs 0 to 1 as the hero scrolls away; the photo sinks a little
     behind the type (the CSS turns it into a translate). */
  function initHero() {
    var hero = document.querySelector('.solution-hero');
    if (!hero || reduce) return;

    onScroll(function () {
      var r = hero.getBoundingClientRect();
      if (r.bottom < 0) return;
      hero.style.setProperty('--m-par', clamp01(-r.top / Math.max(r.height, 1)).toFixed(4));
    });
    undo.push(function () { hero.style.removeProperty('--m-par'); });
  }


  /* ---------- The Problems These Loads Create: swipe deck ----------
     Three cards side by side in a scroll-snap track. The card in view draws
     its icon (data-m-front, keyed in the CSS) once the deck is on screen.
     initProblems in script.js still deals its own classes by scroll; the CSS
     overrides them, and the state here lives in data attributes. */
  function initProblems() {
    var section = document.querySelector('.problems');
    var track = section && section.querySelector('.problems__stack');
    if (!track) return;

    section.classList.add('m-swipe');
    var visible = false;
    var current = null;

    function mark(card) {
      toArray(track.children).forEach(function (c) { c.removeAttribute('data-m-front'); });
      if (!card || !visible) return;
      void card.offsetWidth;  // restart the draw-in
      card.setAttribute('data-m-front', '');
    }

    var c = carousel(track, {
      label: 'Problem',
      light: true,
      onActive: function (card) {
        current = card;
        mark(card);
      }
    });

    if (c && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        mark(visible ? current || c.active() : null);
      }, { threshold: 0.5 });
      io.observe(track);
      undo.push(function () { io.disconnect(); });
    }

    undo.push(function () {
      section.classList.remove('m-swipe');
      toArray(track.children).forEach(function (card) { card.removeAttribute('data-m-front'); });
    });
  }


  /* ---------- What Inaction Costs ---------- */
  function initInaction() {
    var grid = document.querySelector('.inaction__grid');
    if (grid) carousel(grid, { label: 'Cost' });
  }


  /* ---------- Now see it solved: the fan ----------
     On a phone the fan sits a screen below the section's top, so it is
     driven by its own position instead of the section's: it opens as it
     rises from the bottom of the screen to a little above the middle. */
  function initEntry() {
    var section = document.querySelector('.pq-entry');
    var fan = section && section.querySelector('.pq-entry__fan');
    if (!fan) return;

    function frame() {
      var r = fan.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = reduce ? 1 : ease(clamp01((vh * 0.92 - r.top) / (vh * 0.6)));
      fan.style.setProperty('--pq-fan', p.toFixed(4));
    }

    onScroll(frame);
    on(window, 'resize', frame);
    on(window, 'load', frame);
    frame();

    undo.push(function () { fan.style.removeProperty('--pq-fan'); });
  }


  /* ---------- Build / tear down with the phone media query ---------- */
  var built = false;

  function build() {
    if (built) return;
    built = true;
    initHero();
    initProblems();
    initInaction();
    initEntry();
    on(window, 'scroll', queue, { passive: true });
    on(window, 'resize', queue);
    runScroll();
  }

  function teardown() {
    if (!built) return;
    built = false;
    while (undo.length) undo.pop()();
    scrollers = [];
    // Let script.js redraw what it owns (problem cards, fan) for this width
    window.dispatchEvent(new Event('scroll'));
  }

  function sync() {
    if (isPhone()) build();
    else teardown();
  }

  if (phone.addEventListener) phone.addEventListener('change', sync);
  else if (phone.addListener) phone.addListener(sync);
  sync();

}());
