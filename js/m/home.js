/* Phone behaviour: home
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation. Each section is built when
   the phone query starts to match and torn down (classes, injected nodes and
   inline styles removed) when it stops, so desktop is left exactly as
   script.js made it. */
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Slow in, slow out
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Slow out only, for things arriving
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // A px value of a custom property that may be a % of the width
  function tokenPx(name, width, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(raw);
    if (isNaN(n)) return fallback;
    return /%$/.test(raw) ? width * n / 100 : n;
  }

  /* A damped follower: call set(target) from scroll, and render(value) runs
     each frame until value has caught up. */
  function follower(damp, render) {
    var target = 0;
    var current = 0;
    var raf = null;
    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.0004) {
        current = target;
        raf = null;
      } else {
        current += diff * damp;
        raf = requestAnimationFrame(tick);
      }
      render(current);
    }
    return {
      set: function (v) {
        target = v;
        if (raf === null) raf = requestAnimationFrame(tick);
      },
      jump: function (v) {
        target = current = v;
        render(current);
      },
      stop: function () {
        if (raf !== null) cancelAnimationFrame(raf);
        raf = null;
      },
      value: function () { return current; }
    };
  }


  /* ---------- Hero: portrait scroll scene ----------
     The phone version of initHero (which bails out at 768px and below). The
     stage sticks under the navbar and one scrubbed timeline p (0 to 1) plays
     over a runway of 1.3 screens, followed with a damped lerp:
       0    to 0.20  the navbar and the heading fade, leaving the bare film.
                     The film already reaches up under the navbar, so nothing
                     moves as the bar goes (it returns once the hero is past)
       0.24 to 0.60  the film shrinks to a portrait card (60vw wide)
       0.34 to 0.74  the card rises to its resting place; three photos slide
                     out from behind it to the sides (the card stays in front)
       0.74 to 0.96  the description and the buttons arrive under the card
       0.85 on       the photos float slowly in place (touch has no cursor
                     to drift with)
     The resting layout is worked out from the real heights (the copy wraps
     differently on every phone) and keeps clear of a bar fixed to the bottom
     of the screen. Under reduced motion, on landscape phones and on screens
     too short for the end state, the stylesheet's static composition shows
     instead. */
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero || !hero.querySelector('.hero__float')) return;

    var navbar = document.querySelector('.navbar');
    var stage = hero.querySelector('.hero__stage');
    var media = hero.querySelector('.hero__media');
    var heading = hero.querySelector('.hero__heading');
    var desc = hero.querySelector('.hero__desc');
    var floats = toArray(hero.querySelectorAll('.hero__float')).slice(0, 3);

    // Resting spots round the card: side (-1 left, 1 right), y as a fraction
    // of the card's height from its centre, width as a fraction of the
    // screen, a slight tilt, when it starts, and its idle float.
    var SPOTS = [
      { side: -1, y: -0.25, w: 0.30, rot: -3, at: 0.38, amp: 5, period: 7.5, phase: 0 },
      { side: 1, y: 0.02, w: 0.31, rot: 2.5, at: 0.44, amp: 6, period: 9, phase: 2.1 },
      { side: -1, y: 0.31, w: 0.25, rot: 2, at: 0.50, amp: 4, period: 8.2, phase: 4.2 }
    ];
    var RUNWAY = 1.3;    // screens of scroll the scene takes
    var CARD_W = 0.6;    // of the screen width
    var CARD_RATIO = 1.25;
    var CARD_MAX_W = 340;
    var EDGE = 12;       // how close a photo comes to the screen edge
    var TEXT_GAP = 32;   // card to description
    var TOP_PAD = 28;
    var DAMP = 0.1;

    var on = false;
    var geo = null;
    var follow = follower(DAMP, apply);
    var idleRaf = null;
    var idleStart = 0;

    function viewH() {
      return window.innerHeight;
    }

    // The height of anything fixed to the bottom of the screen (the sticky
    // call to action bar), so the end state does not sit under it.
    function bottomBar() {
      var x = window.innerWidth / 2;
      var y = viewH() - 6;
      var el = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
      while (el && el !== document.body && el !== document.documentElement) {
        if (hero.contains(el)) return 0;
        var pos = getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') {
          var r = el.getBoundingClientRect();
          if (r.top > viewH() * 0.6 && r.height < viewH() * 0.3) return viewH() - r.top;
          return 0;
        }
        el = el.parentElement;
      }
      return 0;
    }

    function measure() {
      // Where the stage sticks: right under an in-flow navbar, or at the very
      // top if the navbar floats over the page.
      var heroTop = hero.getBoundingClientRect().top + window.pageYOffset;
      var navH = navbar ? navbar.offsetHeight : 0;
      var stick = Math.max(0, Math.min(heroTop, navH));
      hero.style.setProperty('--m-hero-top', stick + 'px');
      hero.style.setProperty('--m-hero-runway', (RUNWAY * 100) + 'svh');

      var W = stage.clientWidth;
      var H = stage.clientHeight;
      var VH = H + stick;
      var gutter = tokenPx('--gutter', W, 20);

      // The description's real height at its resting width
      var descW = Math.min(W - gutter * 2, 560);
      desc.style.width = descW + 'px';
      var descH = desc.offsetHeight;

      var bottomPad = Math.max(24, bottomBar() + 16);
      var avail = VH - TOP_PAD - bottomPad;
      var cardW = Math.min(W * CARD_W, CARD_MAX_W, VH * 0.42);
      var room = avail - TEXT_GAP - descH;
      if (cardW * CARD_RATIO > room) cardW = room / CARD_RATIO;
      if (cardW < W * 0.36) return null;   // the end state does not fit
      var cardH = cardW * CARD_RATIO;

      var need = cardH + TEXT_GAP + descH;
      var groupTop = TOP_PAD + (avail - need) * 0.42;

      return {
        W: W,
        H: H,
        VH: VH,
        stick: stick,
        navH: navH,
        cardW: cardW,
        cardH: cardH,
        cy0: VH / 2 - stick,
        cyEnd: groupTop + cardH / 2 - stick,
        descH: descH
      };
    }

    function photo(i, p, t, idle) {
      var spot = SPOTS[i];
      var fw = Math.min(spot.w * geo.W, 210);
      var fh = fw * 0.75;
      var cy = lerp(geo.cy0, geo.cyEnd, ease(clamp01((p - 0.34) / 0.40)));
      // A third of the photo stays tucked behind the card, but never closer
      // to the screen edge than EDGE
      var cardLeft = (geo.W - geo.cardW) / 2;
      var outer = Math.max(EDGE, cardLeft - fw * 0.66);
      var restX = spot.side < 0 ? outer + fw / 2 : geo.W - outer - fw / 2;
      var x = lerp(geo.W / 2, restX, t);
      var y = cy + spot.y * geo.cardH * t;
      var ox = 0;
      var oy = 0;
      if (idle > 0) {
        var a = (idleStart ? (performance.now() - idleStart) / 1000 : 0) * Math.PI * 2 / spot.period + spot.phase;
        ox = Math.sin(a) * spot.amp * 0.6 * idle;
        oy = Math.cos(a * 0.8) * spot.amp * idle;
      }
      return 'translate3d(' + (x - fw / 2 + ox).toFixed(2) + 'px, ' + (y - fh / 2 + oy).toFixed(2) + 'px, 0) ' +
        'rotate(' + (spot.rot * t).toFixed(2) + 'deg) scale(' + lerp(0.8, 1, t).toFixed(4) + ')';
    }

    function idleAmount(p) {
      return reduce ? 0 : clamp01((p - 0.85) / 0.15);
    }

    function apply(p) {
      if (!geo) return;
      var fade = clamp01(p / 0.20);
      var shrink = ease(clamp01((p - 0.24) / 0.36));
      var lift = ease(clamp01((p - 0.34) / 0.40));

      var cy = lerp(geo.cy0, geo.cyEnd, lift);
      var w = lerp(geo.W, geo.cardW, shrink);
      var h = lerp(geo.VH, geo.cardH, shrink);

      media.style.left = (geo.W / 2 - w / 2).toFixed(2) + 'px';
      media.style.top = (cy - h / 2).toFixed(2) + 'px';
      media.style.width = w.toFixed(2) + 'px';
      media.style.height = h.toFixed(2) + 'px';
      media.style.borderRadius = lerp(0, 20, shrink).toFixed(2) + 'px';
      media.style.boxShadow = '0 18px 44px rgba(26, 65, 70, ' + (0.3 * shrink).toFixed(3) + ')';

      heading.style.opacity = (1 - fade).toFixed(3);
      heading.style.visibility = fade >= 1 ? 'hidden' : '';
      heading.style.transform = 'translate3d(0, ' + (-fade * 20).toFixed(2) + 'px, 0)';

      // The navbar goes with the heading and comes back as the stage lets go
      // of the screen. It stays while its menu is open or holds focus.
      if (navbar) {
        var away = clamp01((geo.stick + geo.H - hero.getBoundingClientRect().bottom) / 140);
        var keep = navbar.classList.contains('is-open') || navbar.contains(document.activeElement);
        var navOpacity = keep ? 1 : 1 - fade * (1 - away);
        navbar.style.opacity = navOpacity.toFixed(3);
        navbar.style.visibility = navOpacity <= 0.01 ? 'hidden' : '';
      }

      var idle = idleAmount(p);
      floats.forEach(function (el, i) {
        var t = ease(clamp01((p - SPOTS[i].at) / 0.36));
        el.style.width = Math.min(SPOTS[i].w * geo.W, 210).toFixed(2) + 'px';
        el.style.visibility = t <= 0 ? 'hidden' : 'visible';
        el.style.transform = photo(i, p, t, idle);
      });

      var d = easeOut(clamp01((p - 0.74) / 0.22));
      desc.style.opacity = d.toFixed(3);
      desc.style.visibility = d <= 0 ? 'hidden' : 'visible';
      desc.style.top = (cy + h / 2 + TEXT_GAP).toFixed(2) + 'px';
      desc.style.transform = 'translate3d(-50%, ' + ((1 - d) * 20).toFixed(2) + 'px, 0)';

      if (idle > 0) startIdle();
    }

    // The photos' slow float, while the end state is on screen
    function startIdle() {
      if (idleRaf !== null || reduce) return;
      if (!idleStart) idleStart = performance.now();
      idleRaf = requestAnimationFrame(function step() {
        var p = follow.value();
        var idle = idleAmount(p);
        if (!on || idle <= 0 || hero.getBoundingClientRect().bottom <= 0) {
          idleRaf = null;
          return;
        }
        floats.forEach(function (el, i) {
          var t = ease(clamp01((p - SPOTS[i].at) / 0.36));
          el.style.transform = photo(i, p, t, idle);
        });
        idleRaf = requestAnimationFrame(step);
      });
    }

    function progress() {
      var runway = hero.offsetHeight - stage.offsetHeight;
      if (runway <= 0) return 1;
      return clamp01((geo.stick - hero.getBoundingClientRect().top) / runway);
    }

    function reset() {
      [media, heading, desc].concat(floats).forEach(function (el) {
        ['left', 'top', 'width', 'height', 'borderRadius', 'boxShadow', 'opacity', 'visibility', 'transform']
          .forEach(function (name) { el.style[name] = ''; });
      });
      hero.style.removeProperty('--m-hero-top');
      hero.style.removeProperty('--m-hero-runway');
      if (navbar) {
        navbar.style.opacity = '';
        navbar.style.visibility = '';
      }
    }

    function off() {
      follow.stop();
      if (idleRaf !== null) cancelAnimationFrame(idleRaf);
      idleRaf = null;
      if (on || hero.classList.contains('m-hero-on')) {
        hero.classList.remove('m-hero-on');
        reset();
      }
      on = false;
      geo = null;
    }

    function sync() {
      var landscape = window.innerWidth > window.innerHeight;
      if (!isPhone() || reduce || landscape || window.innerHeight < 560) {
        off();
        return;
      }
      hero.classList.add('m-hero-on');
      // The photos are lazy for desktop's sake; here they are on the first
      // screen's runway, so fetch them now rather than as they appear.
      floats.forEach(function (el) {
        var img = el.querySelector('img');
        if (img && img.loading === 'lazy') img.loading = 'eager';
      });
      geo = measure();
      if (!geo) {
        off();
        return;
      }
      on = true;
      follow.jump(progress());
    }

    sync();

    window.addEventListener('scroll', function () {
      if (!on) return;
      follow.set(progress());
    }, { passive: true });

    // The menu opening or closing shows the navbar again
    if (navbar) {
      navbar.addEventListener('focusin', function () { if (on) apply(follow.value()); });
      new MutationObserver(function () { if (on) apply(follow.value()); })
        .observe(navbar, { attributes: true, attributeFilter: ['class'] });
    }

    // Rotation, the browser's toolbar resizing the viewport, and crossing
    // the phone breakpoint (initHero's own debounced reset runs at 120ms,
    // so this one comes after it).
    var timer = null;
    function later() {
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, 180);
    }
    window.addEventListener('resize', later);
    phone.addEventListener('change', function () {
      if (!isPhone()) off();
      later();
    });
    window.addEventListener('load', sync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (on) sync(); });
  }


  /* ---------- Diagnosis: the wave drifts as the section passes ----------
     A slow sideways drift, a pure function of scroll. */
  function initDiagnosis() {
    var sec = document.querySelector('.diagnosis');
    var wave = sec && sec.querySelector('.diagnosis__wave');
    if (!wave || reduce) return;

    var frame = null;
    function update() {
      frame = null;
      if (!isPhone()) {
        wave.style.transform = '';
        return;
      }
      var r = sec.getBoundingClientRect();
      var vh = window.innerHeight;
      var t = clamp01((vh - r.top) / (vh + r.height));
      wave.style.transform = 'translate3d(' + lerp(24, -36, t).toFixed(2) + 'px, 0, 0)';
    }
    function queue() {
      if (frame === null) frame = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    phone.addEventListener('change', queue);
    update();
  }


  /* ---------- Symptoms: swipe deck ----------
     The four cards become a horizontal deck that snaps a card to the left
     gutter, with the next one peeking in. The card in place is the active
     one: it opens its detail (the desktop hover) while the others rest
     slightly smaller. Tapping a resting card or a dot brings it in. */
  function initSymptoms() {
    var sec = document.querySelector('.symptoms');
    var grid = sec && sec.querySelector('.symptoms__grid');
    if (!grid) return;
    var cards = toArray(grid.querySelectorAll('.symptom-card'));
    if (cards.length < 2) return;

    var on = false;
    var dots = null;
    var active = -1;
    var frame = null;

    function step() {
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }

    function setActive(i) {
      if (i === active) return;
      active = i;
      cards.forEach(function (card, n) {
        card.classList.toggle('is-active', n === i);
        card.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
      if (dots) {
        toArray(dots.children).forEach(function (dot, n) {
          dot.classList.toggle('is-active', n === i);
          dot.setAttribute('aria-current', n === i ? 'true' : 'false');
        });
      }
    }

    function update() {
      frame = null;
      var max = grid.scrollWidth - grid.clientWidth;
      var i = grid.scrollLeft >= max - 2 ? cards.length - 1 : Math.round(grid.scrollLeft / step());
      setActive(Math.max(0, Math.min(cards.length - 1, i)));
    }

    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(update);
    }

    function go(i) {
      grid.scrollTo({ left: i * step(), behavior: reduce ? 'auto' : 'smooth' });
    }

    function onCard(e) {
      var i = cards.indexOf(e.currentTarget);
      if (i !== active) go(i);
    }

    function build() {
      if (on) return;
      on = true;
      sec.classList.add('m-deck-on');
      grid.setAttribute('aria-roledescription', 'carousel');
      grid.setAttribute('aria-label', 'Symptoms');

      dots = document.createElement('div');
      dots.className = 'm-deck-dots';
      cards.forEach(function (card, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-deck-dot';
        b.setAttribute('aria-label', 'Symptom ' + (i + 1) + ' of ' + cards.length);
        b.addEventListener('click', function () { go(i); });
        dots.appendChild(b);
        card.addEventListener('click', onCard);
        card.addEventListener('focus', onCard);
      });
      grid.parentNode.insertBefore(dots, grid.nextSibling);
      grid.addEventListener('scroll', onScroll, { passive: true });
      active = -1;
      update();
    }

    function teardown() {
      if (!on) return;
      on = false;
      sec.classList.remove('m-deck-on');
      grid.removeAttribute('aria-roledescription');
      grid.removeAttribute('aria-label');
      grid.removeEventListener('scroll', onScroll);
      cards.forEach(function (card) {
        card.classList.remove('is-active');
        card.removeAttribute('aria-current');
        card.removeEventListener('click', onCard);
        card.removeEventListener('focus', onCard);
      });
      if (dots && dots.parentNode) dots.parentNode.removeChild(dots);
      dots = null;
      active = -1;
    }

    function sync() {
      if (isPhone()) build();
      else teardown();
    }

    sync();
    phone.addEventListener('change', sync);
    window.addEventListener('resize', function () { if (on) onScroll(); });
  }


  /* ---------- Quote: read-along ----------
     The phone version of readAlong (script.js turns it off at 768px and
     below, but has already split the words into .quote__word spans). The
     words light, and the rail fills, from when the paragraph's top is 82%
     down the screen until its bottom has reached 40%: so the lit edge moves
     through the text while it crosses the middle of the screen. */
  function initQuote() {
    var quote = document.querySelector('.quote');
    var para = quote && quote.querySelector('.quote__stage p');
    if (!para) return;
    var words = toArray(para.querySelectorAll('.quote__word'));
    if (!words.length) return;

    var START = 0.82;
    var END = 0.40;
    var on = false;
    var follow = follower(0.12, apply);

    function apply(p) {
      para.style.setProperty('--quote-rail', p.toFixed(4));
      var edge = p * (words.length + 1);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle('is-lit', edge >= i + 1);
      }
    }

    function progress() {
      var r = para.getBoundingClientRect();
      var vh = window.innerHeight;
      var travel = vh * START - vh * END + r.height;
      return clamp01((vh * START - r.top) / travel);
    }

    function sync() {
      if (!isPhone() || reduce) {
        if (on) {
          follow.stop();
          quote.classList.remove('m-quote-on');
          // Desktop's readAlong owns these again from here
          if (!quote.classList.contains('is-scrolly')) {
            para.style.removeProperty('--quote-rail');
            words.forEach(function (w) { w.classList.remove('is-lit'); });
          }
        }
        on = false;
        return;
      }
      quote.classList.add('m-quote-on');
      on = true;
      follow.jump(progress());
    }

    sync();
    window.addEventListener('scroll', function () {
      if (on) follow.set(progress());
    }, { passive: true });
    window.addEventListener('resize', function () { if (on) follow.jump(progress()); });
    phone.addEventListener('change', sync);
  }


  /* ---------- Why Yansa: numbered timeline ----------
     Measure, Solve, Support read as three steps on a vertical line. The line
     draws down as the page scrolls (its tip rides 62% down the screen), and
     each step lights as the tip reaches its number. Under reduced motion
     the line is simply drawn. */
  function initWhy() {
    var sec = document.querySelector('.why');
    var grid = sec && sec.querySelector('.why__grid');
    if (!grid) return;
    var cards = toArray(grid.querySelectorAll('.why-card'));
    if (!cards.length) return;

    var LINE = 0.62;
    var NODE = 18;   // the number's centre, from the card's top
    var on = false;
    var top = 0;
    var len = 0;
    var follow = follower(0.12, apply);

    function measure() {
      top = cards[0].offsetTop + NODE;
      len = cards[cards.length - 1].offsetTop + NODE - top;
      grid.style.setProperty('--m-why-top', top + 'px');
      grid.style.setProperty('--m-why-len', Math.max(0, len) + 'px');
    }

    function apply(px) {
      var s = len > 0 ? clamp01(px / len) : 1;
      grid.style.setProperty('--m-why-s', s.toFixed(4));
      cards.forEach(function (card) {
        card.classList.toggle('is-reached', px >= card.offsetTop + NODE - top - 1);
      });
    }

    function target() {
      if (reduce) return len;
      var r = grid.getBoundingClientRect();
      return Math.max(0, Math.min(len, window.innerHeight * LINE - (r.top + top)));
    }

    function sync() {
      if (!isPhone()) {
        if (on) {
          follow.stop();
          sec.classList.remove('m-why-on');
          ['--m-why-top', '--m-why-len', '--m-why-s'].forEach(function (n) { grid.style.removeProperty(n); });
          cards.forEach(function (c) { c.classList.remove('is-reached'); });
        }
        on = false;
        return;
      }
      sec.classList.add('m-why-on');
      on = true;
      measure();
      follow.jump(target());
    }

    sync();
    window.addEventListener('scroll', function () {
      if (on) follow.set(target());
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!on) return;
      measure();
      follow.jump(target());
    });
    window.addEventListener('load', function () { if (on) { measure(); follow.jump(target()); } });
    phone.addEventListener('change', sync);
  }


  initHero();
  initDiagnosis();
  initSymptoms();
  initQuote();
  initWhy();

}());
