/* Phone behaviour: about
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation. Each feature has a build
   and a teardown, so leaving the phone width puts the DOM back as it was.

   Works alongside js/script.js, which keeps running the desktop behaviours
   on phones too (typewriter, the rotator, values, industry tabs, FAQ); this
   file only adds what a phone needs on top of them. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }

  function toArray(list) { return Array.prototype.slice.call(list); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* Runs fn once resizing has paused, only while on a phone */
  function onResizeEnd(fn, delay) {
    var timer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { if (isPhone()) fn(); }, delay);
    });
  }

  function navHeight() {
    var nav = document.querySelector('.navbar');
    return nav ? nav.getBoundingClientRect().height : 64;
  }


  /* ---------- Hero: four drifting prints ----------
     Desktop hides the photo cards under 900px. On a phone they come back
     small, one in each corner, clear of the centred heading. Each rests at
     its own slight tilt and drifts a few px on slow, out-of-step sine waves
     (9 to 15 s periods); as the hero scrolls away they lift at different
     rates (scroll-linked), the larger, "nearer" ones furthest. The loop only
     runs while the hero is on screen. */
  var hero = (function () {
    var root = document.querySelector('.about-hero');
    var cards = root ? toArray(root.querySelectorAll('.about-hero__decor')) : [];
    if (!cards.length) return null;

    // In DOM order: --1 top left, --2 bottom left, --3 bottom right, --4 top right
    var TILT = [-4, 3, -3, 3.5];   // resting angle, degrees
    var LIFT = [58, 44, 36, 76];   // px of lift across the hero's scroll-out
    var AMP_X = 5;                 // px
    var AMP_Y = 6;                 // px
    var AMP_R = 0.9;               // degrees

    var raf = null;
    var live = false;
    var io = null;
    var timers = [];
    var t0 = 0;

    function frame(now) {
      raf = null;
      var rect = root.getBoundingClientRect();
      var through = clamp01(-rect.top / (rect.height || 1));
      var eased = 1 - (1 - through) * (1 - through);
      var t = (now - t0) / 1000;

      cards.forEach(function (el, i) {
        var p = i * 1.9;
        var x = Math.sin(t / (1.6 + i * 0.25) + p) * AMP_X;
        var y = Math.cos(t / (2.0 + i * 0.3) + p) * AMP_Y;
        var r = TILT[i] + Math.sin(t / (2.4 + i * 0.2) + p) * AMP_R;
        if (reduce) { x = 0; y = 0; r = TILT[i]; }
        el.style.transform =
          'translate3d(' + x.toFixed(2) + 'px,' + (y - LIFT[i] * eased).toFixed(2) + 'px,0)' +
          ' rotate(' + r.toFixed(3) + 'deg)';
      });

      if (live && !reduce) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (raf === null) raf = requestAnimationFrame(frame);
    }

    function onScroll() {
      if (live) kick();
    }

    function build() {
      t0 = performance.now();
      cards.forEach(function (el, i) {
        timers.push(window.setTimeout(function () {
          el.classList.add('is-m-in');
        }, reduce ? 0 : 350 + i * 220));
      });
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(function (entries) {
          live = entries[0].isIntersecting;
          if (live) kick();
        });
        io.observe(root);
      } else {
        live = true;
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      kick();
    }

    function teardown() {
      live = false;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      if (io) io.disconnect();
      io = null;
      timers.forEach(window.clearTimeout);
      timers = [];
      window.removeEventListener('scroll', onScroll);
      cards.forEach(function (el) {
        el.classList.remove('is-m-in');
        el.style.transform = '';
      });
    }

    return { build: build, teardown: teardown };
  }());


  /* ---------- Rotating copy that never moves the page ----------
     The We Measure. copy and the Values copy swap between paragraphs of
     different lengths, and script.js eases the box between their heights.
     On a narrow screen that is a line or two each time, which shoves
     everything below while someone is reading. So the box is held at the
     tallest paragraph's height (a min-height through --m-copy-h), measured
     at the current width from a hidden clone.
     The texts mirror SLIDES / VALUES in js/script.js; if those change, a
     stale copy here only makes the reserved height a line off. */
  var MEASURE_COPY = [
    'Every engagement begins with <span class="accent">on site</span> power quality measurement. Before any solution is proposed, we read what the facility\'s electrical system is actually doing.',
    'The right solution is <span class="accent">never assumed</span>. It is sized to what the measurement reveals. Recommendation follows the data, not a standard SKU.',
    'Delivery does not end at installation. Yansa stays <span class="accent">accountable</span> through AMC and post commissioning support, because outcomes matter more than equipment.'
  ];
  var VALUES_COPY = [
    'Every measurement serves a <span class="value-hl">purpose</span>. To solve a real problem, not to move a product.',
    '<span class="value-hl">Clarity</span> over jargon. Harmonics and power factor, translated into cost, uptime, and equipment life.',
    '<span class="value-hl">Excellence</span> is delivering more than we commit. On every engagement, at every stage.'
  ];

  function reserve(el, texts) {
    if (!el) return null;

    function measure() {
      var probe = el.cloneNode(false);
      probe.removeAttribute('id');
      probe.removeAttribute('aria-live');
      probe.className = el.className.replace(/\bis-swapping\b/g, '');
      probe.style.cssText =
        'position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;' +
        'height:auto;min-height:0;transition:none;width:' + el.clientWidth + 'px';
      el.parentNode.appendChild(probe);
      var max = 0;
      texts.concat([el.innerHTML]).forEach(function (html) {
        probe.innerHTML = html;
        max = Math.max(max, probe.offsetHeight);
      });
      el.parentNode.removeChild(probe);
      el.style.setProperty('--m-copy-h', Math.ceil(max) + 'px');
    }

    return {
      build: measure,
      refresh: measure,
      teardown: function () { el.style.removeProperty('--m-copy-h'); }
    };
  }

  var measureBox = reserve(document.querySelector('.about-measure__copy'), MEASURE_COPY);
  var valuesBox = reserve(document.querySelector('.about-values__copy'), VALUES_COPY);


  /* ---------- We Measure.: which word is up ----------
     Three ticks under the copy follow the rotating word (watched, since the
     rotation timing lives in script.js). */
  var measureSteps = (function () {
    var section = document.querySelector('.about-measure');
    var highlight = section && section.querySelector('.measure-highlight');
    var copy = section && section.querySelector('.about-measure__copy');
    if (!highlight || !copy) return null;

    var WORDS = ['measure', 'solve', 'support'];
    var row = null;
    var mo = null;

    function sync() {
      if (!row) return;
      var word = highlight.textContent.replace(/[^a-z]/gi, '').toLowerCase();
      var at = WORDS.indexOf(word);
      toArray(row.children).forEach(function (tick, k) {
        tick.classList.toggle('is-on', k === at);
      });
    }

    function build() {
      row = document.createElement('div');
      row.className = 'm-measure-steps';
      row.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < WORDS.length; i++) row.appendChild(document.createElement('span'));
      copy.parentNode.insertBefore(row, copy.nextSibling);
      mo = new MutationObserver(sync);
      mo.observe(highlight, { childList: true });
      sync();
    }

    function teardown() {
      if (mo) mo.disconnect();
      mo = null;
      if (row && row.parentNode) row.parentNode.removeChild(row);
      row = null;
    }

    return { build: build, teardown: teardown };
  }());


  /* ---------- Industries: tab row, dots, swipe ----------
     The tab row scrolls; its ends fade on whichever side has more to see,
     and choosing a tab glides it into view. Dots under the table show the
     category, and a sideways swipe on the table moves to the next or
     previous one (by clicking the tab, so script.js runs its own morph). */
  var industries = (function () {
    var box = document.querySelector('.industry-tabs');
    var list = box && box.querySelector('.industry-tabs__list');
    var tabs = box ? toArray(box.querySelectorAll('[role="tab"]')) : [];
    if (!list || !tabs.length) return null;

    var dots = null;
    var grid = null;
    var mo = null;
    var touch = null;

    function active() {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute('aria-selected') === 'true') return i;
      }
      return 0;
    }

    function edges() {
      var max = list.scrollWidth - list.clientWidth;
      var x = list.scrollLeft;
      list.classList.toggle('is-m-fits', max <= 2);
      list.classList.toggle('is-m-end', max > 2 && x >= max - 2);
      list.classList.toggle('is-m-mid', max > 2 && x > 2 && x < max - 2);
    }

    function reveal(i, instant) {
      var tab = tabs[i];
      var pad = parseFloat(getComputedStyle(list).paddingLeft) || 20;
      var left = tab.offsetLeft - pad;
      var right = tab.offsetLeft + tab.offsetWidth + pad - list.clientWidth;
      var x = list.scrollLeft;
      var to = x;
      if (left < x) to = left;
      else if (right > x) to = right;
      if (to !== x) list.scrollTo({ left: to, behavior: instant || reduce ? 'auto' : 'smooth' });
    }

    function sync() {
      var at = active();
      if (dots) {
        toArray(dots.children).forEach(function (d, k) { d.classList.toggle('is-on', k === at); });
      }
    }

    function onTabClick(e) {
      var i = tabs.indexOf(e.currentTarget);
      if (i >= 0) window.setTimeout(function () { reveal(i); }, 30);
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) { touch = null; return; }
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function onTouchEnd(e) {
      if (!touch) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - touch.x;
      var dy = t.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      var next = active() + (dx < 0 ? 1 : -1);
      if (next < 0 || next >= tabs.length) return;
      tabs[next].click();
    }

    function build() {
      grid = box.querySelector('.industry-grid');

      dots = document.createElement('div');
      dots.className = 'm-industry-dots';
      dots.setAttribute('aria-hidden', 'true');
      tabs.forEach(function () { dots.appendChild(document.createElement('span')); });
      box.appendChild(dots);

      mo = new MutationObserver(sync);
      tabs.forEach(function (tab) {
        mo.observe(tab, { attributes: true, attributeFilter: ['aria-selected'] });
        tab.addEventListener('click', onTabClick);
        tab.addEventListener('focus', onTabClick);
      });
      list.addEventListener('scroll', edges, { passive: true });
      if (grid) {
        grid.addEventListener('touchstart', onTouchStart, { passive: true });
        grid.addEventListener('touchend', onTouchEnd, { passive: true });
      }
      sync();
      edges();
      reveal(active(), true);
    }

    function refresh() {
      edges();
      reveal(active(), true);
    }

    function teardown() {
      if (mo) mo.disconnect();
      mo = null;
      tabs.forEach(function (tab) {
        tab.removeEventListener('click', onTabClick);
        tab.removeEventListener('focus', onTabClick);
      });
      list.removeEventListener('scroll', edges);
      list.classList.remove('is-m-fits', 'is-m-end', 'is-m-mid');
      if (grid) {
        grid.removeEventListener('touchstart', onTouchStart);
        grid.removeEventListener('touchend', onTouchEnd);
      }
      if (dots && dots.parentNode) dots.parentNode.removeChild(dots);
      dots = null;
    }

    return { build: build, refresh: refresh, teardown: teardown };
  }());


  /* ---------- FAQ: keep the tapped question in view ----------
     Opening one answer closes the other. When the closing one sits above,
     the list shrinks under the finger and the tapped question can slide up
     behind the navbar; once the swap has settled, ease it back into view. */
  var faq = (function () {
    var items = toArray(document.querySelectorAll('.faq__item'));
    if (!items.length) return null;
    var timer = null;

    function onClick(e) {
      var summary = e.currentTarget;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var top = summary.getBoundingClientRect().top;
        var min = navHeight() + 12;
        if (top < min) {
          window.scrollBy({ top: top - min - 8, behavior: reduce ? 'auto' : 'smooth' });
        }
      }, 460);
    }

    function each(fn) {
      items.forEach(function (item) {
        var s = item.querySelector('summary');
        if (s) fn(s);
      });
    }

    return {
      build: function () { each(function (s) { s.addEventListener('click', onClick); }); },
      teardown: function () {
        window.clearTimeout(timer);
        each(function (s) { s.removeEventListener('click', onClick); });
      }
    };
  }());


  /* ---------- Build / tear down with the phone width ---------- */
  var parts = [hero, measureBox, valuesBox, measureSteps, industries, faq].filter(Boolean);
  var built = false;

  function build() {
    if (built) return;
    built = true;
    parts.forEach(function (p) { p.build(); });
  }

  function teardown() {
    if (!built) return;
    built = false;
    parts.forEach(function (p) { p.teardown(); });
  }

  function onChange() {
    if (isPhone()) build();
    else teardown();
  }

  if (phone.addEventListener) phone.addEventListener('change', onChange);
  else if (phone.addListener) phone.addListener(onChange);

  onResizeEnd(function () {
    parts.forEach(function (p) { if (p.refresh) p.refresh(); });
  }, 180);

  // Web fonts change line breaks, so the reserved heights are re-measured
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (!built) return;
      parts.forEach(function (p) { if (p.refresh) p.refresh(); });
    });
  }

  onChange();
}());
