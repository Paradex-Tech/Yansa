/* Phone behaviour: solution
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation.

   Serves solution.html and pq-solved.html. Everything here is built by
   build() and taken apart by teardown(), so leaving the phone width (a
   rotation, a resized window) hands the page back to the desktop scripts
   with no classes, nodes or inline styles left behind. Scroll-linked values
   are pure functions of scroll position; time only drives the ambient glow
   on the PQ Solved hero and the icon replays. */
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

  /* One rAF per scroll for every scroll-linked piece on the page. These
     listeners are added after script.js's, so where both write the same
     thing (the glimpse waves) this frame runs last and wins. */
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

  // Strips the reveal from cards that start off to the side of a carousel:
  // they are clipped by the track, so the observer would only fire mid-swipe.
  function unreveal(items) {
    items.forEach(function (el, i) {
      if (i >= 2 && el.hasAttribute('data-reveal')) el.removeAttribute('data-reveal');
      else if (i < 2 && el.hasAttribute('data-reveal')) el.style.setProperty('--reveal-delay', i * 90 + 'ms');
    });
  }


  /* ---------- Snap carousel ----------
     The track is styled in css/m/solution.css; this adds the dots, marks
     the card in view, and writes each card's distance from the snapped
     position (--m-d, 0 to 1) so cards ease down as they leave. Snap
     positions are clamped to the track's end, so the last card counts as
     in view once the track cannot scroll further. */
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


  /* ---------- Solutions hero: slow parallax ----------
     --m-par runs 0 to 1 as the hero scrolls away; the photo sinks a little
     behind the type (the CSS turns it into a translate). */
  function initSolutionHero() {
    var hero = document.querySelector('.solution-hero');
    if (!hero || reduce) return;

    onScroll(function () {
      var r = hero.getBoundingClientRect();
      if (r.bottom < 0) return;
      hero.style.setProperty('--m-par', clamp01(-r.top / Math.max(r.height, 1)).toFixed(4));
    });
    undo.push(function () { hero.style.removeProperty('--m-par'); });
  }


  /* ---------- Loads: carousel with live icons ----------
     The card in view plays its icon (the desktop hover animation), again
     every few seconds while the row is on screen, and on a tap. */
  function initGenerates() {
    var grid = document.querySelector('.generates__grid');
    if (!grid) return;

    var REPLAY = 3600;
    var visible = false;
    var timer = null;
    var c;

    function play(card) {
      if (reduce || !card || !card.hasAttribute('data-anim')) return;
      card.classList.remove('m-play');
      void card.offsetWidth;
      card.classList.add('m-play');
    }

    function schedule() {
      window.clearInterval(timer);
      timer = null;
      if (!visible || reduce) return;
      timer = window.setInterval(function () { play(c && c.active()); }, REPLAY);
    }

    c = carousel(grid, {
      label: 'Load',
      onActive: function (card) {
        if (visible) play(card);
        schedule();
      }
    });
    if (!c) return;

    c.items.forEach(function (card) {
      on(card, 'click', function (e) {
        if (e.target.closest('a')) return;
        play(card);
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(c.active());
        schedule();
      }, { threshold: 0.45 });
      io.observe(grid);
      undo.push(function () { io.disconnect(); });
    }

    undo.push(function () {
      window.clearInterval(timer);
      c.items.forEach(function (card) { card.classList.remove('m-play'); });
    });
  }


  /* ---------- The Problems These Loads Create: pinned stack ----------
     The section is about two screens tall and its stage sticks for the
     whole run. Card 1 is in place; cards 2 and 3 each slide up from under
     the stage over half the run (with a short hold either side), and every
     card already covered eases back, shrinks and dims for each card on top
     of it. initProblems in script.js still deals its own classes; they are
     overridden in the CSS, and the state here lives in data attributes and
     custom properties, which its className writes do not touch. */
  function initProblems() {
    var section = document.querySelector('.problems');
    if (!section) return;

    var stage = section.querySelector('.problems__sticky');
    var stack = section.querySelector('.problems__stack');
    var cards = toArray(section.querySelectorAll('.problem-card'));
    if (!stage || !stack || cards.length < 2) return;

    if (reduce) {
      section.classList.add('m-list');
      undo.push(function () { section.classList.remove('m-list'); });
      return;
    }

    section.classList.add('m-stack');

    var bar = document.createElement('div');
    bar.className = 'm-prob-bar';
    bar.setAttribute('aria-hidden', 'true');
    var fills = cards.map(function () {
      var seg = document.createElement('span');
      var fill = document.createElement('i');
      seg.appendChild(fill);
      bar.appendChild(seg);
      return fill;
    });
    inject(bar, stage, stack.nextSibling);

    var HOLD = 0.14;     // share of each card's run spent still, either side
    var LIFT = 12;       // px a covered card eases back, per card above it
    var SHRINK = 0.045;  // scale lost per card above
    var DIM = 0.3;       // darkening per card above
    var front = -1;

    cards.forEach(function (card, i) {
      card.style.setProperty('--m-z', String(i + 1));
    });

    function setFront(i) {
      if (i === front) return;
      front = i;
      cards.forEach(function (card, j) {
        card.removeAttribute('data-m-front');
        if (j === i) {
          void card.offsetWidth;  // restart the draw-in
          card.setAttribute('data-m-front', '');
        }
      });
    }

    function frame() {
      var r = section.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < -vh || r.top > vh * 2) return;

      var run = Math.max(1, r.height - vh);
      var t = clamp01(-r.top / run);
      var seg = 1 / (cards.length - 1);
      var travel = stage.getBoundingClientRect().bottom - stack.getBoundingClientRect().top + 24;

      var arrived = cards.map(function (card, i) {
        if (i === 0) return 1;
        var start = (i - 1) * seg + HOLD * seg;
        return ease(clamp01((t - start) / (seg * (1 - HOLD * 2))));
      });

      cards.forEach(function (card, i) {
        var cover = 0;
        for (var j = i + 1; j < cards.length; j++) cover += arrived[j];
        var y = (1 - arrived[i]) * travel - cover * LIFT;
        card.style.setProperty('--m-y', y.toFixed(1) + 'px');
        card.style.setProperty('--m-s', (1 - cover * SHRINK).toFixed(4));
        card.style.setProperty('--m-dim', Math.min(0.6, cover * DIM).toFixed(3));
        fills[i].style.setProperty('--f', arrived[i].toFixed(3));
      });

      // A card counts as arrived (and draws its icon) most of the way in;
      // nothing plays until the stage is well on screen.
      var top = 0;
      arrived.forEach(function (a, i) { if (a > 0.8) top = i; });
      setFront(r.top < vh * 0.35 && r.bottom > vh * 0.5 ? top : -1);
    }

    onScroll(frame);
    on(window, 'resize', frame);
    frame();

    undo.push(function () {
      section.classList.remove('m-stack');
      cards.forEach(function (card) {
        card.removeAttribute('data-m-front');
        ['--m-y', '--m-s', '--m-dim', '--m-z'].forEach(function (p) { card.style.removeProperty(p); });
      });
    });
  }


  /* ---------- Entry to PQ Solved: the fan ----------
     On a phone the fan sits a screen below the section's top, so it is
     driven by its own position instead of the section's: it opens as it
     rises from the bottom of the screen to a little above the middle. The
     waves straighten on the same progress; script.js draws them too, from
     the section, and this frame runs after it. The wave path is the one in
     script.js (pqWavePath), repeated here. */
  function wavePath(w, h, amp, cycles, dist, phase) {
    var N = 140;
    var d = '';
    for (var i = 0; i <= N; i++) {
      var x = i / N;
      var a = x * Math.PI * 2 * cycles + phase;
      var y = Math.sin(a) +
        dist * (0.34 * Math.sin(3 * a + 1.1) + 0.2 * Math.sin(5 * a + 0.4) + 0.11 * Math.sin(9 * a));
      d += (i ? 'L' : 'M') + (x * w).toFixed(1) + ' ' + (h / 2 - y * amp).toFixed(1);
    }
    return d;
  }

  function initEntry() {
    var section = document.querySelector('.pq-entry');
    var fan = section && section.querySelector('.pq-entry__fan');
    if (!fan) return;

    var waves = toArray(fan.querySelectorAll('[data-pq-wave]'));

    function frame() {
      var r = fan.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = reduce ? 1 : ease(clamp01((vh * 0.92 - r.top) / (vh * 0.6)));
      fan.style.setProperty('--pq-fan', p.toFixed(4));

      // The small waves hold still, drawn clean (client request, 12 Oct)
      var phase = 0;
      waves.forEach(function (svg) {
        var box = svg.viewBox.baseVal;
        var cycles = parseFloat(svg.getAttribute('data-cycles')) || 3;
        var amp = box.height * 0.34;
        var raw = svg.querySelector('.pq-wave__raw');
        var clean = svg.querySelector('.pq-wave__clean');
        if (!raw || !clean) return;
        raw.setAttribute('d', wavePath(box.width, box.height, amp, cycles, 0, phase));
        raw.style.opacity = '0';
        clean.setAttribute('d', wavePath(box.width, box.height, amp, cycles, 0, phase));
        clean.style.opacity = '1';
      });
    }

    onScroll(frame);
    on(window, 'resize', frame);
    on(window, 'load', frame);
    frame();

    undo.push(function () { fan.style.removeProperty('--pq-fan'); });
  }


  /* ---------- What Inaction Costs, Match the fix, solution rows ---------- */
  function initCarousels() {
    var inaction = document.querySelector('.inaction__grid');
    if (inaction) carousel(inaction, { label: 'Cost', light: true });

    var fit = document.querySelector('.pqs-fit__grid');
    if (fit) carousel(fit, { label: 'Problem', light: true });

    toArray(document.querySelectorAll('.solutions-row__grid')).forEach(function (grid) {
      carousel(grid, { label: 'Product' });
    });
  }


  /* ---------- PQ Solved hero: ambient glow ----------
     With no cursor, the bright grid's window drifts on two slow sine waves
     (periods of about 40 and 30 seconds) while the hero is on screen, and
     sheds a faint ring every few seconds. A tap still pings a big ring
     (initPqHover's click handler). */
  function initPqHero() {
    var hero = document.querySelector('.pqs-hero');
    if (!hero || reduce || !('IntersectionObserver' in window)) return;

    var PING_EVERY = 5600;
    var raf = null;
    var lastPing = 0;

    function ping(x, y) {
      var ring = document.createElement('span');
      ring.className = 'pq-ping';
      ring.style.left = x + 'px';
      ring.style.top = y + 'px';
      ring.setAttribute('aria-hidden', 'true');
      ring.addEventListener('animationend', function () { ring.remove(); });
      hero.insertBefore(ring, hero.firstChild.nextSibling);
    }

    function tick(now) {
      var w = hero.clientWidth;
      var h = hero.clientHeight;
      var x = w * (0.5 + 0.34 * Math.sin(now / 6400));
      var y = h * (0.44 + 0.24 * Math.sin(now / 4800 + 1.3));
      hero.style.setProperty('--hx', x.toFixed(1) + 'px');
      hero.style.setProperty('--hy', y.toFixed(1) + 'px');
      // initPqHover drops .is-hot on pointerleave, which a touch fires after every tap
      hero.classList.add('is-hot');
      if (now - lastPing > PING_EVERY) {
        lastPing = now;
        ping(x, y);
      }
      raf = requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
    io.observe(hero);

    undo.push(function () {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      hero.classList.remove('is-hot');
      hero.style.removeProperty('--hx');
      hero.style.removeProperty('--hy');
    });
  }


  /* ---------- Product dialog: bottom sheet ----------
     The sheet's look and motion are in the CSS. This adds the drag handle,
     starts each product at the top of its copy, and closes the sheet on a
     swipe down that begins at the top of the content (or on the handle): a
     pull of more than about a quarter of the sheet, or a quick flick. The
     close itself is script.js's (the close button), so focus and the scroll
     lock are handled in one place. */
  function initSheet() {
    var dialog = document.querySelector('.sol-dialog');
    if (!dialog) return;

    var panel = dialog.querySelector('.sol-dialog__panel');
    var scroller = dialog.querySelector('.sol-dialog__scroll');
    var closeButton = dialog.querySelector('.sol-dialog__close');
    if (!panel || !scroller || !closeButton) return;

    var handle = document.createElement('div');
    handle.className = 'm-sheet-handle';
    handle.setAttribute('aria-hidden', 'true');
    inject(handle, panel, panel.firstChild);

    var wasOpen = false;
    var mo = new MutationObserver(function () {
      var open = dialog.classList.contains('is-open');
      if (open && !wasOpen) scroller.scrollTop = 0;
      wasOpen = open;
    });
    mo.observe(dialog, { attributes: true, attributeFilter: ['class'] });

    var startY = 0;
    var startT = 0;
    var dy = 0;
    var armed = false;
    var dragging = false;

    function release() {
      dialog.classList.remove('m-dragging');
      panel.style.setProperty('--m-drag', '0px');
    }

    on(panel, 'touchstart', function (e) {
      if (!dialog.classList.contains('is-open') || e.touches.length > 1) return;
      startY = e.touches[0].clientY;
      startT = e.timeStamp;
      dy = 0;
      dragging = false;
      armed = scroller.scrollTop <= 0 || !!e.target.closest('.m-sheet-handle');
    }, { passive: true });

    on(panel, 'touchmove', function (e) {
      if (!armed) return;
      var d = e.touches[0].clientY - startY;
      if (!dragging) {
        if (d < -6) { armed = false; return; }  // scrolling the copy up
        if (d < 6) return;
        dragging = true;
        dialog.classList.add('m-dragging');
      }
      e.preventDefault();
      dy = Math.max(0, d);
      panel.style.setProperty('--m-drag', dy.toFixed(1) + 'px');
    }, { passive: false });

    function end(e) {
      if (!dragging) return;
      dragging = false;
      armed = false;
      var speed = dy / Math.max(1, e.timeStamp - startT);
      var far = dy > Math.min(160, panel.offsetHeight * 0.26);
      // Letting go of the drag class re-arms the transition, so the sheet
      // either glides on out from where the finger left it, or back up.
      release();
      if (far || speed > 0.65) closeButton.click();
    }

    on(panel, 'touchend', end);
    on(panel, 'touchcancel', end);

    undo.push(function () {
      mo.disconnect();
      release();
      panel.style.removeProperty('--m-drag');
    });
  }


  /* ---------- Build / tear down with the phone media query ---------- */
  var built = false;

  function build() {
    if (built) return;
    built = true;
    initSolutionHero();
    initGenerates();
    initProblems();
    initEntry();
    initCarousels();
    initPqHero();
    initSheet();
    on(window, 'scroll', queue, { passive: true });
    on(window, 'resize', queue);
    runScroll();
  }

  function teardown() {
    if (!built) return;
    built = false;
    while (undo.length) undo.pop()();
    scrollers = [];
    // Let script.js redraw what it owns (waves, problem cards) for this width
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
