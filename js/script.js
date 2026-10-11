/* =========================================================
   Yansa — site scripts

   Every feature is an init function that returns early when
   its markup is not on the current page, so one file serves
   all five pages. Sections that animate on scroll write only
   an opt-in class (e.g. .is-scrolly); the stylesheet already
   describes the finished state, so with no JavaScript, reduced
   motion or a narrow screen the page is still complete.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasObserver = 'IntersectionObserver' in window;


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

  /* Runs fn once the window has stopped resizing for `delay` ms. */
  function onResizeEnd(fn, delay) {
    var timer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, delay);
    });
  }

  /* Runs fn at most once per animation frame while the page scrolls. */
  function onScrollFrame(fn) {
    var frame = null;
    window.addEventListener('scroll', function () {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        fn();
      });
    }, { passive: true });
  }

  /* Calls fn the first time el is at least `threshold` visible. */
  function onFirstView(el, threshold, fn) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        fn();
      });
    }, { threshold: threshold });
    observer.observe(el);
  }


  /* ---------- Card hover motion (home) ----------
     A hovered card lifts slightly; symptom cards also tilt toward the
     cursor by up to 3 degrees. Both are eased toward their target each
     frame so the card settles like a spring. The Why Yansa cards only
     lift, since a tilt fought the underline drawn under their heading. */
  function initCardMotion() {
    if (reduceMotion) return;

    var MAX_TILT = 3;
    var HOVER_SCALE = 1.012;
    var EASE = 0.12;

    toArray(document.querySelectorAll('.symptom-card, .why-card')).forEach(function (card) {
      var tilts = card.classList.contains('symptom-card');
      var target = { x: 0, y: 0, scale: 1 };
      var current = { x: 0, y: 0, scale: 1 };
      var frame = null;

      function step() {
        current.x += (target.x - current.x) * EASE;
        current.y += (target.y - current.y) * EASE;
        current.scale += (target.scale - current.scale) * EASE;

        var settled =
          Math.abs(target.x - current.x) < 0.01 &&
          Math.abs(target.y - current.y) < 0.01 &&
          Math.abs(target.scale - current.scale) < 0.0005;

        if (settled) {
          current.x = target.x;
          current.y = target.y;
          current.scale = target.scale;
          frame = null;
        }

        card.style.transform = tilts
          ? 'rotateX(' + current.x.toFixed(2) + 'deg)' +
            ' rotateY(' + current.y.toFixed(2) + 'deg)' +
            ' scale(' + current.scale.toFixed(4) + ')'
          : 'scale(' + current.scale.toFixed(4) + ')';

        if (!settled) frame = requestAnimationFrame(step);
      }

      function run() {
        if (!frame) frame = requestAnimationFrame(step);
      }

      card.addEventListener('mouseenter', function () {
        target.scale = HOVER_SCALE;
        run();
      });

      if (tilts) {
        card.addEventListener('mousemove', function (event) {
          var rect = card.getBoundingClientRect();
          var offsetX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          var offsetY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          target.y = Math.max(-1, Math.min(1, offsetX)) * MAX_TILT;
          target.x = Math.max(-1, Math.min(1, offsetY)) * -MAX_TILT;
          run();
        });
      }

      card.addEventListener('mouseleave', function () {
        target.x = 0;
        target.y = 0;
        target.scale = 1;
        run();
      });
    });
  }


  /* ---------- We Measure. / Solve. / Support. (about) ----------
     The highlighted word is split into characters that roll up out of the
     orange box while the next word rolls in, each staggered off its
     neighbour. The box and the paragraph ease to their new size. The
     section is armed from here, so nothing is hidden if this never runs. */
  function initMeasureRotator() {
    var measure = document.querySelector('.about-measure');
    if (!measure) return;

    var highlight = measure.querySelector('.measure-highlight');
    var copy = measure.querySelector('.about-measure__copy');
    var live = measure.querySelector('.about-measure__live');

    var SLIDES = [
      {
        word: 'Measure.',
        copy:
          'Every engagement begins with <span class="accent">on site</span> power ' +
          'quality measurement. Before any solution is proposed, we read what the ' +
          "facility's electrical system is actually doing."
      },
      {
        word: 'Solve.',
        copy:
          'The right solution is <span class="accent">never assumed</span>. It is ' +
          'sized to what the measurement reveals. Recommendation follows the ' +
          'data, not a standard SKU.'
      },
      {
        word: 'Support.',
        copy:
          'Delivery does not end at installation. Yansa stays ' +
          '<span class="accent">accountable</span> through AMC and post commissioning ' +
          'support, because outcomes matter more than equipment.'
      }
    ];

    var STAGGER = 20;   // ms between one character and the next
    var OUT_MS = 360;   // matches .rotate-char.is-out
    var IN_MS = 460;    // matches .rotate-char
    var HOLD = 1800;    // how long a slide rests once it has landed
    var WIPE_MS = 1000; // entrance fade-up + highlighter wipe

    var slide = 0;

    function renderWord(word) {
      highlight.textContent = '';
      for (var i = 0; i < word.length; i++) {
        var ch = document.createElement('span');
        ch.className = 'rotate-char';
        ch.textContent = word.charAt(i);
        ch.style.transitionDelay = i * STAGGER + 'ms';
        highlight.appendChild(ch);
      }
      return highlight.children;
    }

    function setCharState(nodes, state) {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].className = state ? 'rotate-char ' + state : 'rotate-char';
      }
    }

    function holdThenAdvance(nodes) {
      window.setTimeout(advance, IN_MS + (nodes.length - 1) * STAGGER + HOLD);
    }

    /* New characters start below the box; the box width and paragraph
       height are pinned to their old values, then one forced reflow commits
       that start state so the new values animate. */
    function show(next) {
      var prevWidth = highlight.offsetWidth;
      var prevHeight = copy.offsetHeight;

      var nodes = renderWord(SLIDES[next].word);
      copy.innerHTML = SLIDES[next].copy;

      highlight.style.width = 'auto';
      copy.style.height = 'auto';
      var nextWidth = highlight.offsetWidth;
      var nextHeight = copy.offsetHeight;

      highlight.style.width = prevWidth + 'px';
      copy.style.height = prevHeight + 'px';
      void highlight.offsetWidth;

      highlight.style.width = nextWidth + 'px';
      copy.style.height = nextHeight + 'px';
      setCharState(nodes, 'is-in');
      copy.classList.remove('is-swapping');

      if (live) live.textContent = 'We ' + SLIDES[next].word;
      holdThenAdvance(nodes);
    }

    function advance() {
      var nodes = highlight.children;
      setCharState(nodes, 'is-out');
      copy.classList.add('is-swapping');

      window.setTimeout(function () {
        slide = (slide + 1) % SLIDES.length;
        show(slide);
      }, OUT_MS + (nodes.length - 1) * STAGGER);
    }

    /* The first word is split when the section is armed, so the wipe runs
       across a box that is already the right width. */
    function start() {
      measure.classList.add('is-rotating');
      var nodes = highlight.children;
      setCharState(nodes, 'is-in');
      holdThenAdvance(nodes);
    }

    // Pinned pixel sizes go stale when the column reflows
    onResizeEnd(function () {
      highlight.style.width = '';
      copy.style.height = '';
    }, 150);

    if (reduceMotion || !hasObserver) {
      measure.classList.add('is-armed', 'is-visible');
      return;
    }

    measure.classList.add('is-armed');
    setCharState(renderWord(SLIDES[slide].word), null);

    onFirstView(measure, 0.35, function () {
      measure.classList.add('is-visible');
      window.setTimeout(start, WIPE_MS);
    });
  }


  /* ---------- Our Values (about) ----------
     A compact panel, not a full screen. Once it sits in the middle of the
     viewport, wheel, touch and keyboard scrolling step through the values
     instead of moving the page (one value per gesture); past the last value
     in either direction the page scrolls on as normal. The first gesture
     that meets the panel only settles it in the centre.

     The active value's bar widens; the label and copy fade out, are swapped
     while invisible, and fade back in.

     The panel also gets an entrance: its contents rise into place as it
     arrives. The classes come off once that has played, as they would
     otherwise override the copy's own swap transition. */
  function initValues() {
    var values = document.querySelector('.about-values');
    if (!values) return;

    var track = values.querySelector('.about-values__bars');
    var bars = toArray(values.querySelectorAll('.value-bar'));
    var valueCopy = values.querySelector('.about-values__copy');
    var valueLive = values.querySelector('.about-values__live');
    var panel = values.querySelector('.about-values__panel');

    var VALUES = [
      {
        word: 'Purpose',
        copy:
          'Every measurement serves a <span class="value-hl">purpose</span>. ' +
          'To solve a real problem, not to move a product.'
      },
      {
        word: 'Clarity',
        copy:
          '<span class="value-hl">Clarity</span> over jargon. Harmonics and ' +
          'power factor, translated into cost, uptime, and equipment life.'
      },
      {
        word: 'Excellence',
        copy:
          '<span class="value-hl">Excellence</span> is delivering more than we ' +
          'commit. On every engagement, at every stage.'
      }
    ];

    var FADE_MS = 300;  // matches .about-values__copy's opacity transition
    var LOCK_MS = 700;  // least time between two values
    var GAP_MS = 180;   // a pause this long ends a gesture (and its inertia)
    var index = -1;     // -1 so the first pass always paints
    var swapTimer = null;
    var lastStep = 0;
    var lastInput = 0;
    var spent = false;  // the current gesture has already moved the panel

    function layout(active) {
      for (var i = 0; i < bars.length; i++) {
        bars[i].classList.toggle('is-active', i === active);
      }
    }

    function swapCopy(active) {
      if (valueLive) {
        valueLive.textContent = VALUES[active].word;
        valueLive.classList.remove('is-swapping');
      }
      var prevHeight = valueCopy.offsetHeight;
      valueCopy.innerHTML = VALUES[active].copy;
      valueCopy.style.height = 'auto';
      var nextHeight = valueCopy.offsetHeight;
      valueCopy.style.height = prevHeight + 'px';
      void valueCopy.offsetWidth;
      valueCopy.style.height = nextHeight + 'px';
      valueCopy.classList.remove('is-swapping');
    }

    function show(active) {
      if (active === index) return;
      var first = index === -1;
      index = active;

      layout(active);
      window.clearTimeout(swapTimer);

      if (first) {
        swapCopy(active);
        return;
      }

      valueCopy.classList.add('is-swapping');
      if (valueLive) valueLive.classList.add('is-swapping');
      swapTimer = window.setTimeout(function () {
        swapCopy(active);
      }, FADE_MS);
    }

    /* How far the panel's middle sits from the viewport's middle, or null
       when it is too far off (or too tall) to take over the scroll. */
    function offsetFromCentre() {
      var rect = values.getBoundingClientRect();
      if (rect.height > window.innerHeight) return null;
      var offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      return Math.abs(offset) < window.innerHeight * 0.2 ? offset : null;
    }

    // Phones never hold the scroll here; the values cycle on their own
    var phone = window.matchMedia('(max-width: 768px)');

    // True when the gesture was spent on the panel rather than the page
    function jack(dir) {
      if (phone.matches) return false;
      var offset = offsetFromCentre();
      if (offset === null) return false;

      // A gesture keeps firing (trackpad inertia, held keys) until it pauses
      var now = Date.now();
      if (now - lastInput > GAP_MS) spent = false;
      lastInput = now;
      if (spent || now - lastStep < LOCK_MS) return true;

      var next = index + dir;
      if (next < 0 || next >= VALUES.length) return false;

      lastStep = now;
      spent = true;
      if (Math.abs(offset) > 4) {
        window.scrollBy({ top: offset, behavior: reduceMotion ? 'auto' : 'smooth' });
        return true;
      }
      show(next);
      return true;
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || !e.deltaY) return;
      if (jack(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
    }, { passive: false });

    var touchY = null;
    var touchHeld = false;
    window.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
      touchHeld = false;
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (touchY === null) return;
      if (touchHeld) {
        e.preventDefault();
        return;
      }
      var dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 12) return;
      if (jack(dy > 0 ? 1 : -1)) {
        touchHeld = true;
        e.preventDefault();
      }
    }, { passive: false });

    var KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
    window.addEventListener('keydown', function (e) {
      var dir = KEYS[e.key];
      if (!dir || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === ' ' && e.shiftKey) dir = -1;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY)$/.test(t.tagName))) return;
      if (jack(dir)) e.preventDefault();
    });

    // Seeded without transitions so the bars are in place on first view
    track.classList.add('is-static');
    show(0);
    void track.offsetWidth;
    track.classList.remove('is-static');

    onResizeEnd(function () {
      valueCopy.style.height = '';
    }, 200);

    /* Phones: the values advance by themselves while the panel is on screen
       (client request, 11 Oct), and a tap on a bar jumps to that value.
       Reduced motion keeps them still until tapped. */
    var AUTO_MS = 3500;
    var autoTimer = null;
    var onScreen = false;

    function stopAuto() {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }

    function startAuto() {
      stopAuto();
      // An announcement every few seconds would talk over a screen reader
      if (valueLive) valueLive.setAttribute('aria-live', phone.matches && !reduceMotion ? 'off' : 'polite');
      if (!phone.matches || !onScreen || reduceMotion) return;
      autoTimer = window.setInterval(function () {
        show((index + 1) % VALUES.length);
      }, AUTO_MS);
    }

    bars.forEach(function (bar, i) {
      bar.addEventListener('click', function () {
        if (!phone.matches) return;
        show(i);
        startAuto();
      });
    });

    if (hasObserver) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) startAuto(); else stopAuto();
      }, { threshold: 0.4 }).observe(values);
    }
    phone.addEventListener('change', startAuto);

    if (panel && !reduceMotion && hasObserver) {
      values.classList.add('is-armed');
      onFirstView(panel, 0.35, function () {
        values.classList.add('is-visible');
        window.setTimeout(function () {
          values.classList.remove('is-armed', 'is-visible');
        }, 1200);
      });
    }
  }


  /* ---------- The Problems These Loads Create (solutions) ----------
     Scroll position picks the front card as the section's middle travels
     from 70% to 30% of the viewport. Cards already passed lift away and the
     rest cascade behind the front one; each card keeps its slot as a class
     so every move is one CSS transition. */
  function initProblems() {
    var problems = document.querySelector('.problems');
    if (!problems) return;

    var stack = problems.querySelector('.problems__stack');
    var cards = toArray(problems.querySelectorAll('.problem-card'));
    var dots = toArray(problems.querySelectorAll('.dot'));
    var live = problems.querySelector('.problems__live');

    var SLOTS = ['is-front', 'is-next', 'is-later'];
    var index = -1;

    function deal(front) {
      if (front === index) return;
      index = front;

      cards.forEach(function (card, i) {
        var slot = i < front ? 'is-past' : SLOTS[i - front] || 'is-later';
        card.className = 'problem-card ' + slot;
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === front);
      });

      if (live) {
        var heading = cards[front].querySelector('h3');
        live.textContent = heading ? heading.textContent : '';
      }
    }

    function fromScroll() {
      var r = problems.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = clamp01((vh * 0.7 - (r.top + r.height / 2)) / (vh * 0.4));
      return Math.min(cards.length - 1, Math.floor(p * cards.length));
    }

    function redeal() {
      index = -1;
      deal(fromScroll());
    }

    onScrollFrame(function () {
      deal(fromScroll());
    });

    // First deal without transitions
    stack.classList.add('is-static');
    redeal();
    void stack.offsetWidth;
    stack.classList.remove('is-static');

    window.addEventListener('load', redeal);
    onResizeEnd(redeal, 200);

    /* The icons draw in as their card reaches the front. Holding .is-inview
       back until the section is mid-viewport keeps the first icon from
       playing unseen; dropping it on exit lets it replay. */
    if (hasObserver) {
      new IntersectionObserver(function (entries) {
        problems.classList.toggle('is-inview', entries[0].isIntersecting);
      }, { rootMargin: '-30% 0px -30% 0px' }).observe(problems);
    } else {
      problems.classList.add('is-inview');
    }
  }


  /* ---------- Footer mark ----------
     Swaps the static icon for the rippling one from
     concentric-waves-icon.js, only once that is actually mounted. */
  function initFooterMark() {
    var icon = document.querySelector('.footer__icon');
    if (!icon || reduceMotion || typeof window.mountConcentricWaves !== 'function') return;

    var fallback = icon.querySelector('img');

    window.mountConcentricWaves(icon, {
      size: 56,
      waveColor: '#eeece0',
      dotColor: '#ff8c40',
      bgColor: 'transparent',
      speed: 1,
      ringCount: 2,
      duration: 2
    });

    if (fallback) fallback.remove();
  }


  /* ---------- Solution dialog (solutions) ----------
     A solution card or a Results row grows into a dialog. The panel is
     fixed-positioned, seeded at the clicked element's rect, then its
     top/left/width/height transition to the resting rect. Animating
     geometry rather than scale means nothing inside is ever stretched.
     One dialog serves every card; each carries its body in a hidden block
     that is copied in on open. */
  function initSolutionDialog() {
    var sources = document.querySelectorAll('.solution-card, .results__item');
    if (!sources.length) return;

    var MOVE_MS = 520;  // matches .sol-dialog__panel's transition
    var MAX_W = 880;
    var MARGIN = 24;    // smallest gap kept between panel and viewport edge

    var dialog = document.createElement('div');
    dialog.className = 'sol-dialog';
    dialog.hidden = true;
    dialog.innerHTML =
      '<div class="sol-dialog__backdrop"></div>' +
      '<div class="sol-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="sol-dialog-title">' +
        '<button class="sol-dialog__close" type="button" aria-label="Close">&#215;</button>' +
        '<div class="sol-dialog__scroll">' +
          '<div class="sol-dialog__media"></div>' +
          '<div class="sol-dialog__content">' +
            '<h3 class="sol-dialog__title" id="sol-dialog-title"></h3>' +
            '<div class="sol-dialog__body"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);

    var panel = dialog.querySelector('.sol-dialog__panel');
    var scroller = dialog.querySelector('.sol-dialog__scroll');
    var media = dialog.querySelector('.sol-dialog__media');
    var title = dialog.querySelector('.sol-dialog__title');
    var body = dialog.querySelector('.sol-dialog__body');
    var closeButton = dialog.querySelector('.sol-dialog__close');

    var source = null;  // the element currently expanded
    var hideTimer = null;

    /* Hiding the scrollbar widens the viewport; the width is handed back as
       padding so the page underneath does not shift. */
    function lockScroll() {
      var bar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('--sol-scrollbar', bar + 'px');
      document.body.classList.add('sol-dialog-open');
    }

    function unlockScroll() {
      document.body.classList.remove('sol-dialog-open');
      document.body.style.removeProperty('--sol-scrollbar');
    }

    function frame(rect) {
      panel.style.top = rect.top + 'px';
      panel.style.left = rect.left + 'px';
      panel.style.width = rect.width + 'px';
      panel.style.height = rect.height + 'px';
    }

    /* Resting rect: centred, capped, never taller than its content. The
       inner column is held at the resting width for the whole morph so the
       copy is laid out once instead of re-wrapping every frame. */
    function restingRect() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var width = Math.min(MAX_W, vw - MARGIN * 2);

      scroller.style.width = width + 'px';
      panel.style.width = width + 'px';
      panel.style.height = 'auto';
      var height = Math.min(panel.offsetHeight, vh - MARGIN * 2);

      return {
        width: width,
        height: height,
        left: Math.round((vw - width) / 2),
        top: Math.round((vh - height) / 2)
      };
    }

    function open(card) {
      if (source) {
        // Mid-close: finish that hide now so this card can take over
        if (dialog.classList.contains('is-open')) return;
        window.clearTimeout(hideTimer);
        hide();
      }

      var from = card.getBoundingClientRect();
      var isDoc = card.classList.contains('results__item');
      var name = card.querySelector(isDoc ? '.results__title' : '.solution-card__name');
      var detail = card.querySelector(isDoc ? '.results__detail' : '.solution-card__detail');
      var photo = card.querySelector('img');

      panel.classList.toggle('sol-dialog__panel--doc', isDoc);
      title.textContent = name ? name.textContent : '';
      body.innerHTML = detail ? detail.innerHTML : '';

      media.innerHTML = '';
      if (photo) {
        var big = document.createElement('img');
        big.src = photo.src;
        big.alt = '';
        media.appendChild(big);
      }

      source = card;
      lockScroll();
      dialog.hidden = false;

      // Seed at the card, measure the resting rect, then move to it
      dialog.classList.add('is-seeding');
      frame(from);
      var to = restingRect();
      frame(from);
      void panel.offsetWidth;
      dialog.classList.remove('is-seeding');

      frame(to);
      dialog.classList.add('is-open');
      closeButton.focus();
    }

    function hide() {
      dialog.hidden = true;
      dialog.classList.remove('is-open');
      scroller.style.width = '';
      unlockScroll();
      if (source) {
        source.classList.remove('is-morphing');
        source.focus();
        source = null;
      }
    }

    function close() {
      if (!source) return;
      window.clearTimeout(hideTimer);
      // Back to wherever the card is now, in case the page was resized
      frame(source.getBoundingClientRect());
      dialog.classList.remove('is-open');
      hideTimer = window.setTimeout(hide, MOVE_MS);
    }

    toArray(sources).forEach(function (card) {
      card.addEventListener('click', function () {
        open(card);
        card.classList.add('is-morphing');
      });
    });

    closeButton.addEventListener('click', close);
    dialog.querySelector('.sol-dialog__backdrop').addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (!source) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      // The close button is the only focusable element inside
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButton.focus();
      }
    });

    // Re-centre after a resize, with the transition off
    onResizeEnd(function () {
      if (!source) return;
      dialog.classList.add('is-seeding');
      frame(restingRect());
      void panel.offsetWidth;
      dialog.classList.remove('is-seeding');
    }, 120);
  }


  /* ---------- Solutions: row arrows ----------
     Each solution row shows four cards and scrolls sideways past that.
     Rows that overflow get a pair of arrows by the heading; each press
     moves a screenful and the snap points settle it on a card edge.
     Rows that fit show no arrows at all. */
  function initSolutionScroll() {
    var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
      '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    toArray(document.querySelectorAll('.solutions-row__grid')).forEach(function (grid) {
      var nav = document.createElement('div');
      nav.className = 'solutions-row__nav';
      nav.innerHTML =
        '<button class="solutions-row__arrow solutions-row__arrow--prev" type="button" aria-label="Previous solutions">' + CHEVRON + '</button>' +
        '<button class="solutions-row__arrow" type="button" aria-label="Next solutions">' + CHEVRON + '</button>';
      grid.parentNode.insertBefore(nav, grid);

      var prev = nav.firstChild;
      var next = nav.lastChild;
      var frame = null;

      function update() {
        frame = null;
        var max = grid.scrollWidth - grid.clientWidth;
        nav.hidden = max <= 1;
        prev.disabled = grid.scrollLeft <= 1;
        next.disabled = grid.scrollLeft >= max - 1;
      }

      function step(dir) {
        grid.scrollBy({ left: dir * grid.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
      }

      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      grid.addEventListener('scroll', function () {
        if (!frame) frame = window.requestAnimationFrame(update);
      }, { passive: true });
      onResizeEnd(update, 120);
      update();
    });
  }


  /* ---------- Navbar: phone menu ----------
     Below 900px the links live in a drop-down panel behind the menu
     button. It closes when a link is chosen, on Escape (returning focus to
     the button), on a tap outside the bar, and if the window grows past the
     breakpoint. */
  function initMobileNav() {
    var navbar = document.querySelector('.navbar');
    var toggle = navbar && navbar.querySelector('.navbar__toggle');
    if (!toggle) return;

    var wide = window.matchMedia('(min-width: 901px)');

    function setOpen(open) {
      navbar.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!navbar.classList.contains('is-open'));
    });

    toArray(navbar.querySelectorAll('.navbar__links a')).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !navbar.classList.contains('is-open')) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener('click', function (event) {
      if (navbar.classList.contains('is-open') && !navbar.contains(event.target)) setOpen(false);
    });

    var onWide = function () { if (wide.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else wide.addListener(onWide);
  }


  /* ---------- Navbar: sliding underline ----------
     Rests under the current page's link, slides to whichever link is
     hovered or focused, and glides back on leave. The slide is a CSS
     transition; this only measures. */
  function initNavIndicator() {
    var links = document.querySelector('.navbar__links');
    if (!links) return;

    var bar = document.createElement('span');
    bar.className = 'navbar__indicator';
    bar.setAttribute('aria-hidden', 'true');
    links.appendChild(bar);

    var active = links.querySelector('a.is-active');

    function moveTo(link, instant) {
      if (!link) {
        bar.style.opacity = '0';
        return;
      }
      if (instant) bar.style.transition = 'none';
      // Rects rather than offsetLeft/offsetWidth, which round to whole pixels
      var box = links.getBoundingClientRect();
      var r = link.getBoundingClientRect();
      bar.style.width = r.width + 'px';
      bar.style.transform =
        'translate(' + (r.left - box.left) + 'px, ' + (r.bottom - box.top + 2) + 'px)';
      bar.style.opacity = '1';
      if (instant) {
        void bar.offsetWidth; // commit the jump before restoring the slide
        bar.style.transition = '';
      }
    }

    toArray(links.querySelectorAll('a')).forEach(function (link) {
      link.addEventListener('mouseenter', function () { moveTo(link); });
      link.addEventListener('focus', function () { moveTo(link); });
    });
    links.addEventListener('mouseleave', function () { moveTo(active); });
    links.addEventListener('focusout', function (event) {
      if (!links.contains(event.relatedTarget)) moveTo(active);
    });

    // Start in place, and re-measure once the web font settles link widths
    moveTo(active, true);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { moveTo(active, true); });
    }
    window.addEventListener('resize', function () { moveTo(active, true); });
  }


  /* ---------- Symptom cards: keyboard access ----------
     The detail reveal is pure CSS; a tab stop lets a keyboard open it
     through :focus-within. */
  function initSymptomFocus() {
    toArray(document.querySelectorAll('.symptom-card')).forEach(function (card) {
      card.setAttribute('tabindex', '0');
    });
  }


  /* ---------- PQ Solved: scroll-linked wave, cursor spotlight, jump bar ----------
     initPqScroll writes --pq-p (0 to 1) on every [data-pq-progress]
     section, a pure function of scroll position:
       enter  0 as the section's top is 85% down the viewport, 1 once it has
              travelled 80% of a viewport up (the glimpse cards fan out)
       leave  0 at the top of the page, 1 after three quarters of the hero
              has scrolled away
       The Solutions entry also sends out ripples (two centres of four rings)
       for as long as it is on screen: a slow steady flow, pushed along by
       scrolling (the unclamped distance, so they keep coming after p has
       reached 1)
     It also redraws each [data-pq-wave] svg: a clean sine, plus a distorted
     copy (extra harmonics) whose distortion and opacity fall as p rises, so
     the wave straightens as you scroll. Under reduced motion p stays 1. */
  function pqWavePath(w, h, amp, cycles, dist, phase) {
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

  function initPqScroll() {
    var targets = toArray(document.querySelectorAll('[data-pq-progress]'));
    if (!targets.length) return;

    var items = targets.map(function (el) {
      return {
        el: el,
        mode: el.getAttribute('data-pq-progress'),
        rings: toArray(el.querySelectorAll('.pq-entry__rings span')),
        waves: toArray(el.querySelectorAll('[data-pq-wave]'))
      };
    });

    function progress(it, rect) {
      if (reduceMotion) return 1;
      if (it.mode === 'leave') {
        return clamp01(window.pageYOffset / Math.max(rect.height * 0.75, 1));
      }
      return clamp01((window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.8));
    }

    // Rings come in two centres of four. Each ring is one step further round
    // a cycle that p drives: it grows from nothing, thins and fades as it
    // widens. The second centre runs half a step behind the first.
    function spread(it, phase) {
      it.rings.forEach(function (ring, i) {
        var s = (phase + (i % 4) / 4 + (i >= 4 ? 0.5 / 4 : 0)) % 1;
        var grow = Math.min(1, s * 6);
        ring.style.setProperty('--rs', (0.06 + s * 1.2).toFixed(4));
        ring.style.setProperty('--ro', (0.65 * (1 - s) * grow).toFixed(4));
      });
    }

    function draw(svg, p, phase) {
      var box = svg.viewBox.baseVal;
      var cycles = parseFloat(svg.getAttribute('data-cycles')) || 3;
      var amp = box.height * 0.34;
      var raw = svg.querySelector('.pq-wave__raw');
      var clean = svg.querySelector('.pq-wave__clean');
      var dist = (1 - p) * 1.15;
      raw.setAttribute('d', pqWavePath(box.width, box.height, amp, cycles, dist, phase));
      raw.style.opacity = ((1 - p) * 0.9).toFixed(3);
      clean.setAttribute('d', pqWavePath(box.width, box.height, amp, cycles, 0, phase));
      clean.style.opacity = (0.4 + 0.6 * p).toFixed(3);
    }

    var queued = false;
    function frame() {
      queued = false;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.el.getBoundingClientRect();
        if (rect.bottom < -50 || rect.top > vh + 50) return;
        var p = progress(it, rect);
        it.el.style.setProperty('--pq-p', p.toFixed(4));
        it.el.style.setProperty('--pq-fan', p.toFixed(4));
        var phase = reduceMotion ? 0 : window.pageYOffset * 0.006;
        it.waves.forEach(function (svg) { draw(svg, p, phase); });
        if (it.rings.length) {
          // Distance travelled since the section started entering, past p = 1 too
          it.q = Math.max(0, (window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.8));
          if (reduceMotion || !it.flowing) spread(it, it.q * 0.3);
        }
      });
    }
    function queue() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(frame);
      }
    }

    // Ripples keep coming while the section is on screen
    items.forEach(function (it) {
      if (!it.rings.length || reduceMotion || !('IntersectionObserver' in window)) return;
      it.q = 0;
      it.flowing = false;
      var raf = null;
      function tick(now) {
        if (!it.flowing) {
          raf = null;
          return;
        }
        spread(it, it.q * 0.3 + now / 18000);
        raf = requestAnimationFrame(tick);
      }
      new IntersectionObserver(function (entries) {
        it.flowing = entries[0].isIntersecting;
        if (it.flowing && !raf) raf = requestAnimationFrame(tick);
      }).observe(it.el);
    });

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    frame();
  }

  /* ---------- PQ Solved hero: cursor glow and pings ----------
     The bright grid shows round the pointer (--hx / --hy), and the pointer
     sheds a ring every so often as it moves; a click sheds a bigger one.
     Rings remove themselves when they finish. Mouse only, and not under
     reduced motion. */
  function initPqHover() {
    var hero = document.querySelector('.pqs-hero');
    if (!hero || reduceMotion) return;

    var lastPing = 0;
    var lastX = 0;
    var lastY = 0;

    function ping(x, y, big) {
      var ring = document.createElement('span');
      ring.className = 'pq-ping' + (big ? ' pq-ping--big' : '');
      ring.style.left = x + 'px';
      ring.style.top = y + 'px';
      ring.setAttribute('aria-hidden', 'true');
      ring.addEventListener('animationend', function () { ring.remove(); });
      hero.insertBefore(ring, hero.firstChild.nextSibling);
    }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      hero.style.setProperty('--hx', x + 'px');
      hero.style.setProperty('--hy', y + 'px');
      hero.classList.add('is-hot');

      var now = performance.now();
      var moved = Math.abs(x - lastX) + Math.abs(y - lastY);
      if (now - lastPing > 260 && moved > 60) {
        lastPing = now;
        lastX = x;
        lastY = y;
        ping(x, y, false);
      }
    });

    hero.addEventListener('pointerleave', function () {
      hero.classList.remove('is-hot');
    });

    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var r = hero.getBoundingClientRect();
      ping(e.clientX - r.left, e.clientY - r.top, true);
    });
  }

  // The glow on [data-spot] cards follows the pointer
  function initSpotlight() {
    toArray(document.querySelectorAll('[data-spot]')).forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // The pill bar on PQ Solved marks the solution row in view
  function initPqPills() {
    var pills = toArray(document.querySelectorAll('.pqs-pills a'));
    if (!pills.length || !('IntersectionObserver' in window)) return;

    var seen = {};
    pills.forEach(function (pill) {
      var row = document.querySelector(pill.getAttribute('href'));
      if (!row) return;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { seen[row.id] = entry.isIntersecting; });
        var current = null;
        pills.forEach(function (p) {
          var id = p.getAttribute('href').slice(1);
          if (seen[id] && !current) current = id;
        });
        pills.forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('href') === '#' + current);
        });
      }, { rootMargin: '-35% 0px -55% 0px' }).observe(row);
    });
  }

  /* ---------- Navbar: hides on the way down the page, returns on the way up ----------
     Direction is judged over 8px of travel so jitter does not flip it. The
     bar stays put (and so keeps its space, so nothing below moves) and only
     slides away. It is never hidden near the top of the page, while the
     mobile menu is open, or while a pinned stage is holding at the navbar's
     edge (Home hero, YanQ sequence): hiding it there would leave a gap above
     the stage. Flip HIDE_WHEN to 'up' to invert the behaviour. */
  function initNavAutoHide() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var HIDE_WHEN = 'down';   // direction of travel down the page that hides the bar
    var STEP = 8;             // px of travel before the direction counts
    var root = document.documentElement;
    var last = window.pageYOffset;
    var hidden = false;
    var queued = false;

    function pinned() {
      var edge = navbar.offsetHeight;
      return toArray(document.querySelectorAll(
        '.hero.is-scrolly .hero__stage, .yanq-flow.is-scrolly .yanq-flow__stage, .cases.is-scrolly .cases__stage'
      )).some(function (el) {
        return Math.abs(el.getBoundingClientRect().top - edge) <= 1.5;
      });
    }

    function set(hide) {
      if (hide === hidden) return;
      hidden = hide;
      navbar.classList.toggle('is-hidden', hide);
      root.classList.toggle('nav-hidden', hide);
    }

    function update() {
      queued = false;
      var y = window.pageYOffset;
      if (y <= navbar.offsetHeight || navbar.classList.contains('is-open') || pinned()) {
        set(false);
        last = y;
        return;
      }
      var dy = y - last;
      if (Math.abs(dy) < STEP) return;
      set(HIDE_WHEN === 'down' ? dy > 0 : dy < 0);
      last = y;
    }

    window.addEventListener('scroll', function () {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* ---------- Industries We Serve: category tabs (About) ----------
     A tablist over one table. The table is built here from the three
     fallback cards in the markup, so the copy lives in one place. Roving
     tabindex: Tab reaches the row once, arrows, Home and End move within it.
     Choosing a tab runs one morph:
       1  the "+" marks turn half a turn, and the words turn away (staggered)
       2  new words and a new layout are set (3 or 2 across, the last row
          stretching), then each cell glides from its old box to its new one
          (FLIP), cells that did not exist grow in, the table's height eases
          between the two, and the new words turn back
     Under reduced motion, or without the Web Animations API, it just swaps. */
  function initIndustryTabs() {
    var box = document.querySelector('.industry-tabs');
    if (!box) return;

    var tabs = toArray(box.querySelectorAll('[role="tab"]'));
    var panels = toArray(box.querySelectorAll('[role="tabpanel"]'));
    var holder = box.querySelector('.industry-tabs__panels');
    if (!tabs.length || tabs.length !== panels.length || !holder) return;

    var data = panels.map(function (panel) {
      return toArray(panel.querySelectorAll('li')).map(function (li) {
        return li.textContent.trim();
      });
    });
    var MAX = Math.max.apply(null, data.map(function (d) { return d.length; }));

    var grid = document.createElement('div');
    grid.className = 'industry-grid';
    grid.id = 'industry-grid';
    grid.setAttribute('role', 'tabpanel');

    var cells = [];
    var texts = [];
    for (var i = 0; i < MAX; i++) {
      var cell = document.createElement('div');
      cell.className = 'industry-cell';
      var text = document.createElement('span');
      text.className = 'industry-cell__text';
      cell.appendChild(text);
      grid.appendChild(cell);
      cells.push(cell);
      texts.push(text);
    }
    // The "+" markers sit where grid lines cross. There are two; when the
    // cells merge (fewer cells, or a stretched last row) the crossings
    // reduce, and the spare marker drifts onto the other and shrinks away.
    var pluses = [0, 1].map(function () {
      var el = document.createElement('span');
      el.className = 'industry-plus';
      el.setAttribute('aria-hidden', 'true');
      grid.appendChild(el);
      return el;
    });
    holder.appendChild(grid);

    // One bar under the row that slides to the chosen tab
    var list = box.querySelector('.industry-tabs__list');
    var bar = document.createElement('span');
    bar.className = 'industry-tabs__bar';
    bar.setAttribute('aria-hidden', 'true');
    list.appendChild(bar);

    function moveBar(instant) {
      var tab = tabs[current];
      if (!tab) return;
      if (instant) bar.style.transition = 'none';
      bar.style.width = tab.offsetWidth + 'px';
      bar.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
      if (instant) {
        void bar.offsetWidth;
        bar.style.transition = '';
      }
    }

    var narrow = window.matchMedia('(max-width: 560px)');
    var animated = !reduceMotion && typeof grid.animate === 'function';
    var current = 0;
    var angle = 0;
    var busyUntil = 0;
    var seq = 0;
    var running = [];

    function select(index) {
      tabs.forEach(function (tab, k) {
        var on = k === index;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('aria-controls', 'industry-grid');
        tab.tabIndex = on ? 0 : -1;
      });
      moveBar(false);
      grid.setAttribute('aria-labelledby', tabs[index].id);
    }

    // Show n cells on the six-column track; returns the number of rows
    function layout(n) {
      var per = narrow.matches ? 2 : 3;
      var rows = Math.ceil(n / per);
      var rest = n - per * (rows - 1);
      cells.forEach(function (cell, k) {
        if (k >= n) {
          cell.style.display = 'none';
          return;
        }
        var lastRow = k >= per * (rows - 1);
        cell.style.display = '';
        cell.style.gridColumn = 'span ' + (lastRow ? 6 / rest : 6 / per);
      });
      return rows;
    }

    function setWords(items) {
      items.forEach(function (word, k) { texts[k].textContent = word; });
    }

    // Where the lines cross, from the cells' layout boxes (so a glide in
    // progress does not matter): the dividers shared by two neighbouring rows.
    // Where rows do not line up (a stretched last row) the crossing merges
    // into one, at the lower row's divider.
    function crossings() {
      var rows = [];
      cells.forEach(function (cell) {
        if (cell.style.display === 'none') return;
        var top = cell.offsetTop;
        var row = rows.filter(function (r) { return Math.abs(r.top - top) < 2; })[0];
        if (!row) {
          row = { top: top, bottom: top + cell.offsetHeight, lefts: [] };
          rows.push(row);
        }
        row.lefts.push(cell.offsetLeft);
      });
      rows.sort(function (p, q) { return p.top - q.top; });

      var out = [];
      for (var r = 0; r < rows.length - 1; r++) {
        var y = rows[r].bottom + 0.5;
        var upper = rows[r];
        var lower = rows[r + 1];
        var shared = upper.lefts.filter(function (x) {
          return x > 2 && lower.lefts.some(function (m) { return Math.abs(m - x) < 2; });
        });
        if (!shared.length) {
          shared = [lower.lefts.length > 1 ? lower.lefts[1] : grid.clientWidth / 2];
        }
        shared.forEach(function (x) { out.push({ x: x - 0.5, y: y }); });
      }
      return out;
    }

    function place(turn) {
      var spots = crossings();
      if (turn) angle += 180;
      var rest = spots.length ? spots[spots.length - 1] : { x: grid.clientWidth / 2, y: grid.clientHeight / 2 };
      pluses.forEach(function (el, k) {
        var spot = spots[k];
        el.style.setProperty('--px', (spot || rest).x + 'px');
        el.style.setProperty('--py', (spot || rest).y + 'px');
        el.style.setProperty('--ps', spot ? '1' : '0');
        el.style.setProperty('--pr', (k ? -angle : angle) + 'deg');
      });
    }

    function apply(index) {
      setWords(data[index]);
      layout(data[index].length);
      place(false);
    }

    function morph(index) {
      var mine = ++seq;
      running.forEach(function (anim) { anim.cancel(); });
      running = [];

      var h0 = grid.offsetHeight;
      var before = cells.map(function (cell) {
        return cell.style.display === 'none' ? null : cell.getBoundingClientRect();
      });
      var top0 = grid.getBoundingClientRect();

      var items = data[index];
      var outs = [];
      cells.forEach(function (cell, k) {
        if (!before[k]) return;
        var anim = texts[k].animate(
          [{ transform: 'perspective(600px) rotateX(0deg) translateY(0)', opacity: 1 },
           { transform: 'perspective(600px) rotateX(55deg) translateY(-6px)', opacity: 0 }],
          { duration: 380, delay: k * 45, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' }
        );
        outs.push(anim);
        running.push(anim);
      });
      busyUntil = Date.now() + 1800;

      var wait = outs.length ? Promise.all(outs.map(function (a) { return a.finished; })) : Promise.resolve();
      wait.then(function () {
        if (mine !== seq) return;
        outs.forEach(function (anim) { anim.cancel(); });
        running = [];

        setWords(items);
        layout(items.length);
        place(true);

        var h1 = grid.offsetHeight;
        running.push(grid.animate(
          [{ height: h0 + 'px' }, { height: h1 + 'px' }],
          { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }
        ));

        cells.forEach(function (cell, k) {
          if (cell.style.display === 'none') return;
          var after = cell.getBoundingClientRect();
          var old = before[k];
          var move;
          if (old) {
            var dx = old.left - after.left;
            var dy = old.top - after.top;
            var sx = old.width / after.width;
            var sy = old.height / after.height;
            move = [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
                    { transform: 'none' }];
          } else {
            move = [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }];
          }
          running.push(cell.animate(move, { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }));
          running.push(texts[k].animate(
            [{ transform: 'perspective(600px) rotateX(-55deg) translateY(6px)', opacity: 0 },
             { transform: 'perspective(600px) rotateX(0deg) translateY(0)', opacity: 1 }],
            { duration: 600, delay: 260 + k * 60, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
          ));
        });
      });
    }

    function choose(index) {
      if (index === current) return;
      current = index;
      select(index);
      if (animated) morph(index);
      else apply(index);
    }

    tabs.forEach(function (tab, k) {
      tab.addEventListener('click', function () { choose(k); });
      tab.addEventListener('keydown', function (e) {
        var next = -1;
        if (e.key === 'ArrowRight') next = (k + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (k - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next < 0) return;
        e.preventDefault();
        choose(next);
        tabs[next].focus();
      });
    });

    // 3 across becomes 2 across on a phone: re-lay out, no animation
    var onSize = function () {
      seq++;
      running.forEach(function (anim) { anim.cancel(); });
      running = [];
      apply(current);
    };
    if (narrow.addEventListener) narrow.addEventListener('change', onSize);
    else if (narrow.addListener) narrow.addListener(onSize);

    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (Date.now() > busyUntil) place(false);
      }).observe(grid);
    }

    // Keep the bar on its tab when the row changes width (resize, web font)
    if (window.ResizeObserver) {
      new ResizeObserver(function () { moveBar(true); }).observe(list);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { moveBar(true); });
    }

    select(0);
    apply(0);
    box.classList.add('is-ready');
    moveBar(true);
  }

  /* ---------- FAQ (about) ----------
     A <details> has no in-between state, so the script takes ownership of
     `open`: it is set before the opening animation and cleared only after
     the closing one, with the answer's height, gap and opacity animated in
     between. One answer is open at a time. The first opens when the list
     scrolls into view; with no JS the markup's `open` item simply shows. */
  function initFaq() {
    var items = toArray(document.querySelectorAll('.faq__item'));
    if (!items.length) return;

    var DURATION = 420; // matches the transition in style.css

    // Read the resting gap before anything is written inline
    var firstAnswer = items[0].querySelector('.faq__answer');
    var GAP = firstAnswer ? parseFloat(getComputedStyle(firstAnswer).marginTop) || 0 : 0;

    items.forEach(function (item) {
      item.faqTimer = null;
    });

    function settle(item) {
      window.clearTimeout(item.faqTimer);
      item.faqTimer = null;
    }

    function openItem(item) {
      var a = item.querySelector('.faq__answer');
      if (!a) { item.open = true; return; }
      settle(item);

      item.open = true; // the content has to exist to be measured
      item.classList.add('is-animated');

      a.style.height = '0px';
      a.style.marginTop = '0px';
      a.style.opacity = '0';
      void a.offsetHeight;

      a.style.height = a.scrollHeight + 'px';
      a.style.marginTop = GAP + 'px';
      a.style.opacity = '1';

      // Back to auto once arrived, so a resize can still reflow it
      item.faqTimer = window.setTimeout(function () {
        a.style.height = 'auto';
        item.faqTimer = null;
      }, DURATION);
    }

    function closeItem(item) {
      var a = item.querySelector('.faq__answer');
      if (!a) { item.open = false; return; }
      settle(item);

      item.classList.add('is-animated');

      // From a measured height, since `auto` cannot animate
      a.style.height = a.getBoundingClientRect().height + 'px';
      void a.offsetHeight;

      a.style.height = '0px';
      a.style.marginTop = '0px';
      a.style.opacity = '0';

      item.faqTimer = window.setTimeout(function () {
        item.open = false;
        item.faqTimer = null;
      }, DURATION);
    }

    items.forEach(function (item) {
      var summary = item.querySelector('summary');
      if (!summary) return;

      summary.addEventListener('click', function (event) {
        event.preventDefault(); // the script decides when `open` changes

        if (item.open && item.faqTimer === null) {
          closeItem(item);
          return;
        }

        items.forEach(function (other) {
          if (other !== item && other.open) closeItem(other);
        });
        openItem(item);
      });
    });

    if (reduceMotion) {
      // Keep the markup's open item; just enforce one at a time
      items.forEach(function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) return;
          items.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        });
      });
      return;
    }

    // Close everything before first paint, then open the first on view
    var first = items.filter(function (i) { return i.open; })[0] || items[0];
    items.forEach(function (item) { item.open = false; });

    function intro() {
      // A beat after the section's own entrance
      window.setTimeout(function () { openItem(first); }, 520);
    }

    var list = document.querySelector('.faq__list');
    if (list && hasObserver) onFirstView(list, 0.25, intro);
    else intro();
  }


  /* ---------- Typewriter (about statement) ----------
     Characters reveal one at a time with a caret leading them. Every
     character is wrapped and present from the start at opacity 0, so
     nothing reflows while typing and the caret stops can be measured once
     up front; the loop only ever writes a transform. */
  function initTypewriter() {
    var para = document.querySelector('.about-statement p');
    if (!para) return;

    // ms between characters; .tw-caret's transition must not exceed this
    var STEP = 30;
    var chars = [];
    var stops = [];
    var revealed = 0;
    var lastY = null;
    var startTime = null;

    var fullText = para.textContent.replace(/\s+/g, ' ').trim();

    // Split text nodes into per-character spans, keeping inline colour spans
    (function split(node) {
      toArray(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var text = child.nodeValue;
          var frag = document.createDocumentFragment();
          for (var i = 0; i < text.length; i++) {
            var span = document.createElement('span');
            span.className = 'tw-char';
            span.textContent = text.charAt(i);
            frag.appendChild(span);
            chars.push(span);
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          split(child);
        }
      });
    })(para);

    // Assistive tech reads the sentence whole; the shredded copy is hidden
    var srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = fullText;
    para.insertBefore(srText, para.firstChild);

    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    toArray(para.childNodes).forEach(function (node) {
      if (node !== srText) visual.appendChild(node);
    });
    para.appendChild(visual);

    var caret = document.createElement('span');
    caret.className = 'tw-caret';
    caret.setAttribute('aria-hidden', 'true');
    para.appendChild(caret);

    para.classList.add('tw');

    function measure() {
      var base = para.getBoundingClientRect();
      stops = chars.map(function (c) {
        var r = c.getBoundingClientRect();
        return {
          left: r.left - base.left,
          right: r.right - base.left,
          top: r.top - base.top,
          height: r.height
        };
      });
      if (stops.length) caret.style.height = stops[0].height + 'px';
    }

    function moveCaret(i) {
      if (!stops.length) return;
      var stop = stops[i < 0 ? 0 : i];
      var x = i < 0 ? stop.left : stop.right;
      var y = stop.top;
      var transform = 'translate(' + x + 'px, ' + y + 'px)';

      // A line wrap is a jump, not a slide across the paragraph
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        caret.classList.add('is-jump');
        caret.style.transform = transform;
        void caret.offsetWidth;
        caret.classList.remove('is-jump');
      } else {
        caret.style.transform = transform;
      }
      lastY = y;
    }

    function tick(now) {
      if (startTime === null) startTime = now;
      var target = Math.min(chars.length, Math.floor((now - startTime) / STEP) + 1);
      while (revealed < target) {
        chars[revealed].classList.add('is-in');
        revealed++;
      }
      moveCaret(revealed - 1);
      if (revealed < chars.length) requestAnimationFrame(tick);
    }

    if (reduceMotion) {
      chars.forEach(function (c) { c.classList.add('is-in'); });
      revealed = chars.length;
      caret.parentNode.removeChild(caret);
      return;
    }

    measure();
    moveCaret(-1);

    onFirstView(para, 0.35, function () {
      requestAnimationFrame(tick);
    });

    onResizeEnd(function () {
      measure();
      lastY = null;
      moveCaret(revealed - 1);
    }, 120);
  }


  /* ---------- Home hero: film ----------
     The hero video autoplays muted and loops. With reduced motion it is
     held on its poster (its first frame) instead. */
  function initHeroVideo() {
    var video = document.querySelector('.hero__media video');
    if (!video || !reduceMotion) return;
    video.removeAttribute('autoplay');
    video.pause();
  }


  /* ---------- Home hero: scroll-driven sequence ----------
     Adds .is-scrolly, which pins the stage, then plays one scrubbed timeline
     (p, 0 to 1) as the page scrolls. The page's own scroll bar drives it
     (sticky, never a wheel hijack), followed with a damped lerp so a coarse
     wheel notch glides.
       0    to 0.22  the navbar and the heading fade away together, leaving
                     the film bare. The film does not move. It already
                     reaches up under the navbar, so nothing shifts as the
                     navbar goes (it comes back once the hero is scrolled past)
       0.22 to 0.28  a beat with just the film
       0.28 to 0.62  the film shrinks to a card
       0.40 to 0.80  the card lifts to the top; four photos slide out from
                     BEHIND it (the card is in front of them)
       0.80 to 1     the description and buttons arrive under the card
       0.85 on       the photos and the card drift with the cursor
     Not run under reduced motion, on phones, or on screens too short to
     hold the whole end state; those get the plain stack. */
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero || !hero.querySelector('.hero__float')) return;

    var navbar = document.querySelector('.navbar');
    var stage = hero.querySelector('.hero__stage');
    var media = hero.querySelector('.hero__media');
    var heading = hero.querySelector('.hero__heading');
    var desc = hero.querySelector('.hero__desc');
    var floats = toArray(hero.querySelectorAll('.hero__float'));

    // Where each photo rests: x as a fraction of the stage width, y as a
    // fraction of the card's height, both from the card's centre; when it
    // starts; its width at 1440px; and how far the cursor moves it. The lower
    // ones stay shallow so they keep clear of the text under the card.
    var SPOTS = [
      { x: -0.33, y: -0.16, at: 0.42, w: 200, drift: 0.12 },
      { x: 0.33, y: -0.16, at: 0.48, w: 200, drift: 0.08 },
      { x: -0.17, y: 0.30, at: 0.54, w: 170, drift: 0.15 },
      { x: 0.17, y: 0.30, at: 0.60, w: 170, drift: 0.10 }
    ];
    var CARD_W = 210;      // px at scale 1
    var CARD_RATIO = 1.3;  // height over width
    var CARD_DRIFT = 0.06;
    var DRIFT_PX = 300;    // cursor travel (across the whole window) to px of drift
    var TOP_GAP = 36;      // space above the card, resting
    var TEXT_GAP = 48;     // space between the card and the description
    var DAMP = 0.12;

    var geo = null;
    var target = 0;
    var current = 0;
    var raf = null;
    var on = false;
    var mouse = { x: 0, y: 0 };
    var mouseNow = { x: 0, y: 0 };

    // Slow in, slow out: the motion never arrives at a hard stop
    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function measure() {
      var rect = stage.getBoundingClientRect();
      var scale = Math.min(1.25, Math.max(0.6, Math.min(rect.width / 1440, rect.height / 760)));
      var cardH = CARD_W * scale * CARD_RATIO;
      var navH = navbar ? navbar.offsetHeight : 0;
      geo = {
        W: rect.width,
        H: rect.height,
        navH: navH,
        scale: scale,
        cardW: CARD_W * scale,
        cardH: cardH,
        cy0: (rect.height - navH) / 2,
        cyEnd: TOP_GAP + cardH / 2
      };
    }

    function apply(p) {
      if (!geo) return;
      var fade = clamp01(p / 0.22);
      var shrink = ease(clamp01((p - 0.28) / 0.34));
      var lift = ease(clamp01((p - 0.40) / 0.40));
      var drift = clamp01((p - 0.85) / 0.15);
      var dx = -mouseNow.x * drift;
      var dy = -mouseNow.y * drift;

      var cy = lerp(geo.cy0, geo.cyEnd, lift);
      var w = lerp(geo.W, geo.cardW, shrink);
      var h = lerp(geo.H + geo.navH, geo.cardH, shrink);
      var cardX = dx * CARD_DRIFT * DRIFT_PX;
      var cardY = dy * CARD_DRIFT * DRIFT_PX;

      media.style.left = (geo.W / 2 - w / 2 + cardX).toFixed(2) + 'px';
      media.style.top = (cy - h / 2 + cardY).toFixed(2) + 'px';
      media.style.width = w.toFixed(2) + 'px';
      media.style.height = h.toFixed(2) + 'px';
      media.style.borderRadius = lerp(0, 18, shrink).toFixed(2) + 'px';
      media.style.boxShadow = '0 20px 50px rgba(26, 65, 70, ' + (0.28 * shrink).toFixed(3) + ')';

      heading.style.opacity = (1 - fade).toFixed(3);
      heading.style.visibility = fade >= 1 ? 'hidden' : '';
      heading.style.transform = 'translate3d(0, ' + (-fade * 24).toFixed(2) + 'px, 0) ' +
        'scale(' + lerp(1.5, 1.4, fade).toFixed(4) + ')';

      // The navbar goes with the heading, and returns once the hero has been
      // scrolled past (the stage lets go of the screen)
      if (navbar) {
        var away = clamp01((geo.navH + geo.H - hero.getBoundingClientRect().bottom) / 160);
        var navOpacity = 1 - fade * (1 - away);
        navbar.style.opacity = navOpacity.toFixed(3);
        navbar.style.visibility = navOpacity <= 0.01 ? 'hidden' : '';
      }

      floats.forEach(function (el, i) {
        var spot = SPOTS[i];
        var t = ease(clamp01((p - spot.at) / 0.38));
        var fw = spot.w * geo.scale;
        var fh = fw * 0.75;
        var x = geo.W / 2 + spot.x * geo.W * t + dx * spot.drift * DRIFT_PX - fw / 2;
        var y = cy + spot.y * geo.cardH * t + dy * spot.drift * DRIFT_PX - fh / 2;
        el.style.width = fw.toFixed(2) + 'px';
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0) ' +
          'scale(' + lerp(0.8, 1, t).toFixed(4) + ')';
      });

      var d = clamp01((p - 0.80) / 0.20);
      desc.style.opacity = d.toFixed(3);
      desc.style.visibility = d <= 0 ? 'hidden' : '';
      desc.style.top = (cy + h / 2 + TEXT_GAP + cardY).toFixed(2) + 'px';
      desc.style.transform = 'translate3d(-50%, ' + ((1 - d) * 24).toFixed(2) + 'px, 0)';
    }

    // Hand every property back to the stylesheet
    function reset() {
      [media, heading, desc].concat(floats).forEach(function (el) {
        ['left', 'top', 'width', 'height', 'borderRadius', 'boxShadow', 'opacity', 'visibility', 'transform']
          .forEach(function (name) { el.style[name] = ''; });
      });
      if (navbar) {
        navbar.style.opacity = '';
        navbar.style.visibility = '';
      }
    }

    function progress() {
      var runway = hero.offsetHeight - geo.H;
      if (runway <= 0) return 1;
      var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
      return clamp01((stuckAt - hero.getBoundingClientRect().top) / runway);
    }

    function tick() {
      var settled = true;

      var diff = target - current;
      if (Math.abs(diff) < 0.0004) {
        current = target;
      } else {
        current += diff * DAMP;
        settled = false;
      }

      var mx = mouse.x - mouseNow.x;
      var my = mouse.y - mouseNow.y;
      if (Math.abs(mx) + Math.abs(my) < 0.0005) {
        mouseNow.x = mouse.x;
        mouseNow.y = mouse.y;
      } else {
        mouseNow.x += mx * 0.06;
        mouseNow.y += my * 0.06;
        settled = false;
      }

      apply(current);
      raf = settled ? null : requestAnimationFrame(tick);
    }

    function kick() {
      if (raf === null) raf = requestAnimationFrame(tick);
    }

    function sync() {
      if (reduceMotion || window.innerWidth <= 768 || window.innerHeight < 700) {
        if (on || hero.classList.contains('is-scrolly')) {
          hero.classList.remove('is-scrolly');
          reset();
        }
        on = false;
        return;
      }

      hero.classList.add('is-scrolly');
      on = true;
      measure();
      target = progress();
      current = target;
      apply(current);
    }

    sync();

    window.addEventListener('scroll', function () {
      if (!on) return;
      target = progress();
      kick();
    }, { passive: true });

    // The cursor, as -0.5 to 0.5 across the window
    window.addEventListener('pointermove', function (e) {
      if (!on || (e.pointerType && e.pointerType !== 'mouse')) return;
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      if (target > 0.85) kick();
    });

    onResizeEnd(sync, 120);

    // The film's size depends on the media, so re-measure once loaded
    window.addEventListener('load', sync);
  }


  /* ---------- Scroll reveal ----------
     Each element starts a little low and transparent and eases into place
     the first time it is scrolled to, with siblings following one another.
     Targets are picked by selector, so the pages carry no extra markup and
     a selector that matches nothing on a page does nothing.

     Once arrived, an element is handed back to its own stylesheet (the
     reveal's `transform: none` would otherwise outrank hover transforms).
     `step` is the stagger between siblings; `mode: 'fade'` is for anything
     whose transform belongs to another script. Sections with their own
     scroll animation are deliberately absent. */
  function initScrollReveal() {
    if (reduceMotion || !hasObserver) return;

    var SETS = [
      /* every page */
      { sel: '.header-placeholder__overlay > *', step: 110 },

      /* home */
      { sel: '.diagnosis__content > *', step: 90 },
      { sel: '.symptoms__header > *', step: 90 },
      { sel: '.symptoms__grid > *', step: 80, mode: 'fade' },
      { sel: '.quote__inner', step: 0 },
      { sel: '.why__header > *', step: 90 },
      { sel: '.why__grid > *', step: 90, mode: 'fade' },
      { sel: '.cases__header > *', step: 90 },
      { sel: '.cases__stack > *', step: 110, mode: 'fade' },

      /* about */
      { sel: '.industries > h2, .industries > p', step: 90 },
      { sel: '.industry-tabs', step: 0 },
      { sel: '.faq__header > *', step: 90 },
      { sel: '.faq__list > *', step: 70 },

      /* solutions */
      { sel: '.generates > h2, .generates > p', step: 90 },
      { sel: '.generates__grid > *', step: 70 },
      { sel: '.problems__sticky > h2', step: 0 },
      { sel: '.solutions-row__inner > h2, .solutions-row__inner > p', step: 90 },
      { sel: '.solutions-row__grid > *', step: 90 },
      { sel: '.inaction__inner > h2, .inaction__inner > p', step: 90 },
      { sel: '.inaction__grid > *', step: 90 },
      { sel: '.results__inner > h2, .results__inner > p', step: 90 },
      { sel: '.results__list > *', step: 70 },

      /* YanQ */
      { sel: '.yanq-hero__content > *', step: 90 },
      /* PQ Solved */
      { sel: '.pq-entry__copy > *', step: 90 },
      { sel: '.pqs-fit__header > *', step: 90 },
      { sel: '.pqs-fit__grid > *', step: 80, mode: 'fade' },

      /* contact */
      { sel: '.contact-map', step: 0 },
      { sel: '.contact-form-col > *', step: 80 },

      /* footer, every page */
      { sel: '.footer__cta > *', step: 90, mode: 'fade' },
      { sel: '.footer__bottom > *', step: 110 }
    ];

    var DURATION = 700; // matches --reveal-dur in the stylesheet
    var seen = [];

    function done(el) {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-revealed');
      el.style.removeProperty('--reveal-delay');
      el.style.removeProperty('will-change');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('is-revealed');

        /* transitionend never fires for a transition that did not run (a
           hidden tab, say), so a timer backs it up. */
        var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
        var timer = window.setTimeout(function () { done(el); }, DURATION + delay + 160);

        el.addEventListener('transitionend', function (event) {
          if (event.propertyName !== 'opacity') return;
          window.clearTimeout(timer);
          done(el);
        }, { once: true });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    SETS.forEach(function (set) {
      toArray(document.querySelectorAll(set.sel)).forEach(function (el, i) {
        // Skip live regions (no box) and anything in a hidden section
        if (el.classList.contains('sr-only') || el.closest('[hidden]') || seen.indexOf(el) !== -1) return;
        seen.push(el);

        el.setAttribute('data-reveal', set.mode === 'fade' ? 'fade' : 'slide');
        if (set.step) el.style.setProperty('--reveal-delay', i * set.step + 'ms');
        observer.observe(el);
      });
    });

    // Only once there is something to hide
    if (seen.length) document.documentElement.classList.add('js-reveal');
  }


  /* ---------- Quote: scroll-driven read-along (home, YanQ) ----------
     As the paragraph travels from 75% to 28% of the viewport height, the
     rail fills and the words light one at a time (never part-way). The
     section gets .is-scrolly; the paragraph gets --quote-rail.
     A pinned section can pass `opts` to supply its own progress (0 to 1),
     its own on/off test and a damping of 1 for a pure scroll mapping; the
     YanQ sequence does (initYanqFlow). */
  function initQuote() {
    readAlong(document.querySelector('.quote'), '.quote__stage p');
  }

  function readAlong(quote, paraSel, opts) {
    var para = quote && quote.querySelector(paraSel);
    if (!para) return;
    opts = opts || {};

    var DAMP = opts.damp || 0.16;
    var LEAD = 1;       // one word of extra travel, so the last one lights
    var START = 0.75;   // viewport fraction where the reveal begins
    var END = 0.28;     // and where it is complete

    var words = [];
    var target = 0;
    var current = 0;
    var raf = null;
    var on = false;

    // One span per word; the spaces stay as text so wrapping is unchanged.
    // Text nodes are split in place, so inline colour spans survive.
    (function split(node) {
      toArray(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) {
          split(child);
          return;
        }
        if (child.nodeType !== 3) return;

        var frag = document.createDocumentFragment();
        child.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          var span = document.createElement('span');
          span.className = 'quote__word';
          span.textContent = part;
          frag.appendChild(span);
          words.push(span);
        });
        node.replaceChild(frag, child);
      });
    })(para);

    function apply(p) {
      para.style.setProperty('--quote-rail', p.toFixed(4));
      var edge = p * (words.length + LEAD);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle('is-lit', edge >= i + 1);
      }
    }

    function reset() {
      para.style.removeProperty('--quote-rail');
      words.forEach(function (w) { w.classList.remove('is-lit'); });
    }

    function progress() {
      if (opts.progress) return opts.progress();
      var top = para.getBoundingClientRect().top;
      var from = window.innerHeight * START;
      var to = window.innerHeight * END;
      if (from <= to) return 1;
      return clamp01((from - top) / (from - to));
    }

    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.0004) {
        current = target;
        apply(current);
        raf = null;
        return;
      }
      current += diff * DAMP;
      apply(current);
      raf = requestAnimationFrame(tick);
    }

    function sync() {
      var off = opts.enabled ? !opts.enabled() : (reduceMotion || window.innerWidth <= 768);
      if (off) {
        if (on || quote.classList.contains('is-scrolly')) {
          quote.classList.remove('is-scrolly');
          reset();
        }
        on = false;
        return;
      }

      quote.classList.add('is-scrolly');
      on = true;
      target = progress();
      current = target;
      apply(current);
    }

    sync();

    window.addEventListener('scroll', function () {
      if (!on) return;
      target = progress();
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });

    onResizeEnd(sync, 120);
    window.addEventListener('load', sync);
  }


  /* ---------- Process diagrams (YanQ step visuals) ----------
     Adapted from the supplied process-diagrams.js (YANSA process diagrams
     package): its per-element playback, without its own track and scroll
     maths. Each <svg> is played from a local progress L (0 to 1) that the
     caller works out; initYanqFlow passes each step's own progress.
       [data-a="type,a,b,x,y"]  animates while L runs from a to b:
         draw   stroke traces from its start (needs pathLength="1")
         fade   opacity 0 to 1
         pop    opacity 0 to 1, scale .6 to 1
         grow   scaleY 0 to 1 from the bottom
         slide  opacity 0 to 1, translate from (x, y) to rest
         rise   as slide, plus scale .92 to 1
         stream travels by (x, y) and fades out at the end
         drift  travels by (x, y) and stays
       [data-osc="period"]  slides left by `oscPhase` periods (wrapping)
     Nothing is written until prepareDiagram runs, so without it the SVGs
     show their finished state. */
  function diagramEase(v) {
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }

  function prepareDiagram(svg) {
    var els = toArray(svg.querySelectorAll('[data-a]')).map(function (el) {
      var p = el.getAttribute('data-a').split(',');
      if (p[0] === 'draw') {
        el.style.strokeDasharray = '1';
      } else {
        el.style.transformBox = 'fill-box';
        el.style.transformOrigin = p[0] === 'grow' ? 'center bottom' : 'center';
      }
      return { el: el, type: p[0], a: +p[1], b: +p[2], x: +p[3] || 0, y: +p[4] || 0 };
    });
    return { svg: svg, els: els, osc: toArray(svg.querySelectorAll('[data-osc]')) };
  }

  function renderDiagram(d, L, oscPhase) {
    d.els.forEach(function (o) {
      var e = diagramEase(clamp01((L - o.a) / (o.b - o.a)));
      var s = o.el.style;
      switch (o.type) {
        case 'draw':  s.strokeDashoffset = 1 - e; s.opacity = e > 0 ? 1 : 0; break;
        case 'fade':  s.opacity = e; break;
        case 'pop':   s.opacity = e; s.transform = 'scale(' + (0.6 + 0.4 * e) + ')'; break;
        case 'grow':  s.transform = 'scaleY(' + e + ')'; s.opacity = e > 0 ? 1 : 0; break;
        case 'slide': s.opacity = e; s.transform = 'translate(' + o.x * (1 - e) + 'px,' + o.y * (1 - e) + 'px)'; break;
        case 'rise':  s.opacity = e; s.transform = 'translate(' + o.x * (1 - e) + 'px,' + o.y * (1 - e) + 'px) scale(' + (0.92 + 0.08 * e) + ')'; break;
        case 'drift': s.opacity = clamp01(L / 0.1); s.transform = 'translate(' + o.x * e + 'px,' + o.y * e + 'px)'; break;
        case 'stream': s.opacity = clamp01(L / 0.1) * (1 - clamp01((e - 0.75) / 0.25)); s.transform = 'translate(' + o.x * e + 'px,' + o.y * e + 'px)'; break;
      }
    });
    d.osc.forEach(function (el) {
      var period = +el.getAttribute('data-osc');
      el.style.transform = 'translateX(' + (-(oscPhase * period % period)) + 'px)';
    });
  }

  function resetDiagram(d) {
    d.els.forEach(function (o) {
      var s = o.el.style;
      ['stroke-dasharray', 'stroke-dashoffset', 'opacity', 'transform', 'transform-box',
        'transform-origin'].forEach(function (name) { s.removeProperty(name); });
    });
    d.osc.forEach(function (el) { el.style.removeProperty('transform'); });
  }


  /* ---------- How YanQ Works: pinned sequence (YanQ) ----------
     One sticky stage over a runway, as on the Home hero. Every visual state
     is a pure function of how far the stage has been pinned, measured in
     stage heights:
       0   to 0.6   the statement reads along under the pinned heading
       0.6 to 1.4   cream turns to petrol and the heading to grey and
                    orange; the statement rises and fades over the first
                    half, the steps fade in over the second
       1.0 on       the steps, STEP stages each: a step rises to the focus
                    line (the stage's centre, beside the visual box), parks
                    there, still, for HOLD of its share while its diagram
                    builds, then moves up as the next arrives
       last OUT     outro: the steps scroll out, What YanQ Delivers scrolls
                    in beneath the pinned heading, whose side words swap
                    round a fixed "YanQ"; the pin releases on its end state
     Opacity falls off smoothly with a step's distance from the focus line,
     the rail marker rides the wave (see apply), and the visual box stays put while
     its slots crossfade. Nothing moves unless the page scrolls. The hook for
     the supplied SVGs (--flow-progress, --flow-step, --step-progress,
     .is-active) is described above the slots in yanq.html. Off, leaving the
     stacked layout, under reduced motion, at 768px and below, and on
     screens too short to pin. */
  function initYanqFlow() {
    var flow = document.querySelector('.yanq-flow');
    if (!flow) return;

    var stage = flow.querySelector('.yanq-flow__stage');
    var body = flow.querySelector('.yanq-flow__body');
    var intro = flow.querySelector('.yanq-flow__intro');
    var win = flow.querySelector('.yanq-flow__window');
    var list = flow.querySelector('.yanq-flow__list');
    var dotBox = flow.querySelector('.yanq-flow__dots');
    var visual = flow.querySelector('.yanq-flow__visual');
    var spine = flow.querySelector('.yanq-flow__spine');
    var steps = toArray(flow.querySelectorAll('.yanq-flow__step'));
    if (!stage || !body || !intro || !win || !list || !steps.length) return;

    // A step's slot is the .yanq-anim with the same data-step
    var slots = steps.map(function (step) {
      return flow.querySelector('.yanq-anim[data-step="' + step.getAttribute('data-step') + '"]');
    });

    // The process diagram in each slot, prepared only while pinned
    var diagrams = slots.map(function (slot) {
      return slot ? slot.querySelector('svg.yanq-diagram') : null;
    });
    var played = [];
    var WAVE_CYCLES = 6;   // Measurement's screen wave, after it is built

    var READ = 0.6;    // stage heights: the read-along is complete
    var TURN = 1.4;    // the colour change is complete
    var LIST = 1.0;    // the list starts to move
    var ENTER = -0.6;  // list position when it starts (below the focus)
    var LEAVE = 0.2;   // how far past the last step it travels by the end
    var STEP = 2.4;    // stage heights of scroll per step (hold + move)
    var HOLD = 0.45;   // share of a step's scroll spent parked at the focus
    var BUILD_AT = 0.75;  // share of the hold by which its diagram is built
    var OUT = 1;       // stage heights of outro into What YanQ Delivers
    var CLEAR = 24;    // px the box and the focused step keep from the heading
    var DIM = 0.62;    // opacity lost by the step one place below focus
    var INSET = 6;     // px the marker keeps from the stage's top and bottom
    // One period of the wave in yanq-wave-tile.svg, repeated down the spine
    // (40 x 246px, see .yanq-flow__spine): centred on x 20, swinging 17.7
    // either side, starting on the centre line and bulging right first
    var WAVE = { cx: 20, amp: 17.7, period: 246 };
    var CREAM = [250, 250, 239];    // --cream
    var PETROL = [26, 65, 70];      // --petrol
    var INK = [23, 23, 23];         // the heading on cream
    var GREY = [152, 152, 152];     // the heading on petrol
    var CYAN = [76, 200, 192];      // --cyan, for "YanQ"

    var n = steps.length;
    var dots = [];
    var tops = [];     // each step's top within the list, px
    // Focus line: the stage's vertical centre (where the rail marker parks),
    // px below the list window's top, which is the heading's bottom edge.
    // The step in focus and the visual box are both centred on it.
    var focusY = 0;
    var stageH = 1;
    var runway = 1;
    var paraTop = 0;   // the statement's viewport top while pinned
    var gap = 0;       // space between steps in the list, px
    var reach = 0;     // how far the spine reaches above the stage, px
    var heights = [];  // each step's height, px
    var boxH = 0;
    var titleH = 0;
    var on = false;

    // The list's timeline, in step shares (STEP stage heights each): the
    // first step's rise, then for each step a HOLD parked at the focus line
    // and a move on to the next, then the last step's leave
    var segs = [];
    var holdAt = [];   // where each step's hold starts, in shares
    var shares = 0;
    function addSeg(len, from, to) {
      segs.push({ x: shares, len: len, from: from, to: to });
      shares += len;
    }
    addSeg(-ENTER * (1 - HOLD), ENTER, 0);
    for (var h = 0; h < n; h++) {
      holdAt.push(shares);
      addSeg(HOLD, h, h);
      if (h < n - 1) addSeg(1 - HOLD, h, h + 1);
    }
    addSeg(LEAVE * (1 - HOLD), n - 1, n - 1 + LEAVE);

    function posAt(x) {
      if (x <= 0) return ENTER;
      for (var s = 0; s < segs.length; s++) {
        var g = segs[s];
        if (x <= g.x + g.len) {
          return g.from === g.to ? g.from : lerp(g.from, g.to, smooth(clamp01((x - g.x) / g.len)));
        }
      }
      return n - 1 + LEAVE;
    }

    for (var d = 0; d < n; d++) {
      var dot = document.createElement('span');
      dot.className = 'yanq-flow__dot';
      if (dotBox) dotBox.appendChild(dot);
      dots.push(dot);
    }

    function smooth(t) {
      return t * t * (3 - 2 * t);
    }

    function mix(a, b, t, alpha) {
      return 'rgba(' + Math.round(lerp(a[0], b[0], t)) + ', ' +
        Math.round(lerp(a[1], b[1], t)) + ', ' +
        Math.round(lerp(a[2], b[2], t)) + ', ' +
        (alpha === undefined ? 1 : alpha.toFixed(4)) + ')';
    }

    function enabled() {
      return !reduceMotion && window.innerWidth > 768 && window.innerHeight >= 560;
    }

    // Pixels scrolled since the stage stuck (negative on the way in)
    function travelled() {
      var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
      return stuckAt - flow.getBoundingClientRect().top;
    }

    function measure() {
      stageH = stage.getBoundingClientRect().height || 1;
      runway = Math.max(flow.offsetHeight - stageH, 1);
      tops = steps.map(function (step) {
        return step.offsetTop;
      });
      heights = steps.map(function (step) {
        return step.offsetHeight;
      });
      boxH = visual ? visual.offsetHeight : 0;
      titleH = body.offsetTop;   // the body starts at the heading's bottom
      // On a short stage the centre would put the box against the heading;
      // then the pair drops just enough to clear it by CLEAR px
      focusY = Math.max(stageH / 2 - titleH, boxH / 2 + CLEAR, Math.max.apply(null, heights) / 2 + CLEAR);
      paraTop = (parseFloat(getComputedStyle(stage).top) || 0) + body.offsetTop + intro.offsetTop;
      gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      reach = spine ? -spine.offsetTop : 0;
    }

    // Where in the list a (fractional) position falls, px. Past either end
    // it carries on at the end step's spacing, so the first step can rise in
    // and the last one leave.
    function topAt(pos) {
      if (pos <= 0) {
        var first = n > 1 ? tops[1] - tops[0] : steps[0].offsetHeight + gap;
        return tops[0] + pos * first;
      }
      if (pos >= n - 1) {
        var last = n > 1 ? tops[n - 1] - tops[n - 2] : steps[0].offsetHeight + gap;
        return tops[n - 1] + (pos - (n - 1)) * last;
      }
      var a = Math.floor(pos);
      return lerp(tops[a], tops[a + 1], pos - a);
    }

    // Read-along: from the statement reaching 75% of the viewport on the
    // way in, to READ stage heights into the pin
    function readProgress() {
      var t = travelled();
      var start = paraTop - window.innerHeight * 0.75;
      var end = READ * stageH;
      if (end <= start) return 1;
      return clamp01((t - start) / (end - start));
    }

    function apply(t) {
      var u = t / stageH;
      var half = (TURN - READ) / 2;
      var turn = smooth(clamp01((u - READ) / (TURN - READ)));

      // Outro: the last stage of the runway, while What YanQ Delivers rises
      // into place. The steps scroll out with it (--yanq-flow-out), petrol
      // turns back to cream, and the heading's side words swap round the
      // fixed "YanQ", whose orange hands over to the Delivers gradient.
      var runU = runway / stageH;
      var out = clamp01((u - (runU - OUT)) / OUT);
      var swap = smooth(clamp01((out - 0.15) / 0.55));

      flow.style.setProperty('--yanq-flow-bg', out > 0 ?
        mix(PETROL, CREAM, smooth(clamp01(out / 0.7))) : mix(CREAM, PETROL, turn));
      flow.style.setProperty('--yanq-flow-title', mix(INK, GREY, turn));
      flow.style.setProperty('--yanq-flow-brand', mix(INK, CYAN, turn));
      flow.style.setProperty('--yanq-flow-intro', (1 - smooth(clamp01((u - READ) / half))).toFixed(4));
      flow.style.setProperty('--yanq-flow-reveal', smooth(clamp01((u - READ - half) / half)).toFixed(4));
      flow.style.setProperty('--yanq-flow-out', out.toFixed(4));
      flow.style.setProperty('--yanq-flow-swap', swap.toFixed(4));

      // The list's timeline runs over the runway between the colour change
      // and the outro, so it ends as the outro begins
      var span = Math.max(runU - LIST - OUT, 0.001);
      var travel = clamp01((u - LIST) / span);
      var x = travel * shares;
      var pos = posAt(x);
      var held = Math.min(Math.max(pos, 0), n - 1);
      var active = Math.round(held);
      var a = Math.floor(held);
      var b = Math.min(n - 1, a + 1);
      var hNow = lerp(heights[a], heights[b], held - a);

      // The step at `pos` is centred on the focus line
      var offset = focusY - hNow / 2 - topAt(pos);
      list.style.transform = 'translate3d(0, ' + offset.toFixed(2) + 'px, 0)';
      // The mask is fully opaque from just above the focused step's top
      flow.style.setProperty('--yanq-flow-focus', (focusY - hNow / 2).toFixed(1) + 'px');

      // Below the focus a step dims to 1 - DIM. Above it, it fades out as
      // it rises, reaching 0 as its top meets the heading's bottom edge.
      // A parked step stays perfectly still beside its diagram.
      steps.forEach(function (step, i) {
        var d = i - pos;
        var parked = Math.max(focusY - heights[i] / 2, 1);
        var op = d >= 0 ? 1 - DIM * Math.min(d, 1) : clamp01((tops[i] + offset) / parked);
        step.style.opacity = op.toFixed(3);
        step.classList.toggle('is-active', i === active);
      });

      // The box is centred on the same line
      flow.style.setProperty('--yanq-flow-box-y', (focusY - boxH / 2).toFixed(2) + 'px');

      if (visual) {
        visual.style.setProperty('--flow-progress', travel.toFixed(4));
        visual.style.setProperty('--flow-step', (held + 1).toFixed(4));
      }

      // --step-progress: 0 to 0.25 rising into focus, 0.25 to 0.75 over the
      // hold (0.5 is mid-hold), 0.75 to 1 leaving. The diagram builds over
      // the first BUILD_AT of the hold. Oscillators run from the first
      // diagram's completion to the end of the list.
      var oscFrom = holdAt[0] + BUILD_AT * HOLD;
      var oscPhase = clamp01((x - oscFrom) / Math.max(shares - oscFrom, 0.001)) * WAVE_CYCLES;

      slots.forEach(function (slot, i) {
        if (!slot) return;
        var hp = clamp01((x - holdAt[i]) / HOLD);
        var stepP = hp <= 0 ? 0.25 * clamp01((pos - i + 0.5) / 0.5) :
          hp < 1 ? 0.25 + 0.5 * hp :
          0.75 + 0.25 * clamp01((pos - i) / 0.5);
        slot.style.opacity = clamp01(1 - Math.abs(held - i)).toFixed(3);
        slot.style.setProperty('--step-progress', stepP.toFixed(4));
        slot.classList.toggle('is-active', i === active);
        if (played[i]) renderDiagram(played[i], clamp01(hp / BUILD_AT), oscPhase);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });

      // Rail, in three parts:
      //   entry  the marker runs from the top of the wave to the middle
      //          while the first step rises to the focus line
      //   steps  it stays in the middle and the wave slides up past it
      //          steadily, holds included
      //   exit   the wave stops and the marker runs on to the bottom
      var mid = stageH / 2;
      var holdEnd = holdAt[n - 1] + HOLD;
      var markerY;
      if (x < holdAt[0]) {
        markerY = lerp(INSET, mid, clamp01(x / holdAt[0]));
      } else if (x > holdEnd) {
        markerY = lerp(mid, stageH - INSET, clamp01((x - holdEnd) / (shares - holdEnd)));
      } else {
        markerY = mid;
      }
      var slide = Math.max(topAt(n - 1) - topAt(0), topAt(1) - topAt(0));
      var shift = clamp01((x - holdAt[0]) / Math.max(holdEnd - holdAt[0], 0.001)) * slide;
      // The wave tiles from the spine's top, which sits `reach` above the stage
      var phase = ((markerY + reach + shift) % WAVE.period) / WAVE.period;
      var markerX = WAVE.cx + WAVE.amp * Math.sin(2 * Math.PI * phase);
      flow.style.setProperty('--yanq-flow-marker-y', markerY.toFixed(2) + 'px');
      flow.style.setProperty('--yanq-flow-marker-x', markerX.toFixed(2) + 'px');
      flow.style.setProperty('--yanq-flow-wave-y', (-(shift % WAVE.period)).toFixed(2) + 'px');
    }

    function reset() {
      ['--yanq-flow-runway', '--yanq-flow-bg', '--yanq-flow-title', '--yanq-flow-brand',
        '--yanq-flow-intro', '--yanq-flow-reveal', '--yanq-flow-marker-y',
        '--yanq-flow-marker-x', '--yanq-flow-wave-y', '--yanq-flow-focus',
        '--yanq-flow-out', '--yanq-flow-swap', '--yanq-flow-box-y'].forEach(function (name) {
        flow.style.removeProperty(name);
      });
      list.style.transform = '';
      if (visual) {
        visual.style.removeProperty('--flow-progress');
        visual.style.removeProperty('--flow-step');
      }
      steps.forEach(function (step) {
        step.style.opacity = '';
        step.style.transform = '';
        step.classList.remove('is-active');
      });
      slots.forEach(function (slot) {
        if (!slot) return;
        slot.style.opacity = '';
        slot.style.removeProperty('--step-progress');
        slot.classList.remove('is-active');
      });
      dots.forEach(function (dot) { dot.classList.remove('is-active'); });
      played.forEach(function (d) { if (d) resetDiagram(d); });
      played = [];
    }

    function sync() {
      if (!enabled()) {
        if (on || flow.classList.contains('is-scrolly')) {
          flow.classList.remove('is-scrolly');
          reset();
        }
        on = false;
        return;
      }

      // Runway in stage heights: the statement and colour change, the
      // list's timeline at STEP per share, then the outro
      flow.style.setProperty('--yanq-flow-runway', LIST + shares * STEP + OUT);
      flow.classList.add('is-scrolly');
      on = true;
      if (!played.length) {
        played = diagrams.map(function (svg) { return svg ? prepareDiagram(svg) : null; });
      }
      measure();
      apply(travelled());
    }

    sync();
    onScrollFrame(function () {
      if (on) apply(travelled());
    });
    onResizeEnd(sync, 120);
    window.addEventListener('load', sync);

    // The statement's read-along, mapped straight from the pin
    readAlong(intro, '.yanq-flow__quote', {
      damp: 1,
      enabled: enabled,
      progress: readProgress
    });
  }


  /* ---------- Case studies: pinned stepping (home, hidden for now) ----------
     One card is open at a time; the ones already read collapse to a strip
     above it. Scroll position picks the card and the movement is a CSS
     transition. Skipped while the section is hidden, and whenever the open
     card plus the strips would not fit under the navbar. */
  function initCaseStudies() {
    var cases = document.querySelector('.cases');
    if (!cases || cases.hidden || !cases.querySelector('.cases__stage')) return;

    var stage = cases.querySelector('.cases__stage');
    var stack = cases.querySelector('.cases__stack');
    var header = cases.querySelector('.cases__header');
    var cards = toArray(cases.querySelectorAll('.case-card'));
    var dots = toArray(cases.querySelectorAll('.cases__dots .dot'));
    var index = -1;
    var on = false;

    function cssNumber(name, fallback) {
      var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
      return isNaN(n) ? fallback : n;
    }

    function show(active) {
      if (active === index) return;
      index = active;
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === active);
        card.classList.toggle('is-past', i < active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    function reset() {
      index = -1;
      cards.forEach(function (card) { card.classList.remove('is-active', 'is-past'); });
      dots.forEach(function (dot) { dot.classList.remove('is-active'); });
    }

    function fromScroll() {
      var range = cases.offsetHeight - stage.getBoundingClientRect().height;
      if (range <= 0) return cards.length - 1;
      var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
      var travelled = Math.min(Math.max(stuckAt - cases.getBoundingClientRect().top, 0), range);
      return Math.min(cards.length - 1, Math.floor((travelled / range) * cards.length));
    }

    function fits() {
      var tallest = cssNumber('--case-full', 400) + cssNumber('--case-strip', 112) * (cards.length - 1);
      var stagePadTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
      var headerH = header.getBoundingClientRect().height +
        (parseFloat(getComputedStyle(header).marginBottom) || 0);
      return stagePadTop + headerH + tallest + 24 <= window.innerHeight - cssNumber('--nav-height', 0);
    }

    function sync() {
      if (reduceMotion || window.innerWidth <= 768 || !fits()) {
        if (on || cases.classList.contains('is-scrolly')) {
          cases.classList.remove('is-scrolly');
          reset();
        }
        on = false;
        return;
      }

      cases.classList.add('is-scrolly');
      on = true;

      // Seeded without transitions
      stack.classList.add('is-static');
      index = -1;
      show(fromScroll());
      void stack.offsetWidth;
      stack.classList.remove('is-static');
    }

    sync();
    onScrollFrame(function () {
      if (on) show(fromScroll());
    });
    onResizeEnd(sync, 120);
    window.addEventListener('load', sync);
  }


  /* ---------- About hero: floating decor ----------
     The four image wells drift as though suspended in something thick.
     Three movements are summed into one transform:
       drift    - sine waves on long, mismatched periods, so the cards never
                  fall into step and the loop is invisible
       push     - away from the cursor, falling off to nothing at
                  PUSH_RADIUS, eased slowly so a card coasts rather than
                  tracks (the lag is what reads as viscosity)
       parallax - an extra lift as the hero scrolls, eased out so it shows
                  early without flinging the cards clear
     A card's size stands in for its mass: small cards drift and shove
     furthest, while parallax runs the other way so big ones read nearest.
     Runs only while the hero is on screen, and not at all under reduced
     motion or below 900px, where the cards are hidden. */
  function initAboutDecor() {
    var hero = document.querySelector('.about-hero');
    var cards = hero ? toArray(hero.querySelectorAll('.about-hero__decor')) : [];
    var wide = window.matchMedia('(min-width: 901px)');
    if (!cards.length || reduceMotion || !wide.matches) return;

    var PUSH_RADIUS = 340;  // px; beyond this the cursor is not felt
    var PUSH_MAX = 9;       // px of displacement at the very centre
    var PUSH_EASE = 0.035;
    var DRIFT_X = 9;        // px, before the per-card size factor
    var DRIFT_Y = 11;
    var DRIFT_ROT = 1.2;    // degrees
    var LIFT = 118;         // px of parallax across the hero

    var decor = cards.map(function (el, i) {
      var r = el.getBoundingClientRect();
      // Bigger card, smaller factor: it takes more to move
      var factor = Math.min(1.6, Math.max(0.55, 160 / Math.sqrt(r.width * r.height || 1)));
      return {
        el: el,
        factor: factor,
        lift: LIFT / factor,
        px1: 17000 + i * 2300,
        px2: 23000 + i * 3100,
        py1: 19000 + i * 2700,
        py2: 29000 + i * 1900,
        pr: 41000 + i * 5300,
        phase: i * 1.7,
        pushX: 0, pushY: 0,
        toX: 0, toY: 0
      };
    });

    // Parallax counts from the hero's resting position, not from the top of
    // the viewport, since the hero sits below the navbar.
    var heroTop = hero.getBoundingClientRect().top + window.pageYOffset;

    var raf = null;
    var live = false;
    var pointer = null; // null until the cursor is over the hero

    function frame(now) {
      var rect = hero.getBoundingClientRect();
      var through = Math.min(1, Math.max(0, heroTop - rect.top) / (rect.height || 1));
      var eased = 1 - (1 - through) * (1 - through);

      decor.forEach(function (d) {
        var x =
          Math.sin(now / d.px1 + d.phase) * DRIFT_X * d.factor +
          Math.sin(now / d.px2 + d.phase * 1.6) * DRIFT_X * 0.55 * d.factor;
        var y =
          Math.cos(now / d.py1 + d.phase) * DRIFT_Y * d.factor +
          Math.sin(now / d.py2 + d.phase * 2.1) * DRIFT_Y * 0.45 * d.factor;
        var rot = Math.sin(now / d.pr + d.phase) * DRIFT_ROT * d.factor;

        d.pushX += (d.toX - d.pushX) * PUSH_EASE;
        d.pushY += (d.toY - d.pushY) * PUSH_EASE;

        d.el.style.transform =
          'translate3d(' +
          (x + d.pushX).toFixed(2) + 'px,' +
          (y + d.pushY - d.lift * eased).toFixed(2) + 'px,0)' +
          ' rotate(' + rot.toFixed(3) + 'deg)';
      });

      raf = live ? requestAnimationFrame(frame) : null;
    }

    // Where each card wants to sit given the pointer (cubed falloff)
    function aim() {
      decor.forEach(function (d) {
        d.toX = 0;
        d.toY = 0;
        if (!pointer) return;

        var r = d.el.getBoundingClientRect();
        var dx = r.left + r.width / 2 - pointer.x;
        var dy = r.top + r.height / 2 - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist >= PUSH_RADIUS) return;

        var strength = Math.pow(1 - dist / PUSH_RADIUS, 3) * PUSH_MAX * d.factor;
        d.toX = (dx / dist) * strength;
        d.toY = (dy / dist) * strength;
      });
    }

    function start() {
      if (live) return;
      live = true;
      if (raf === null) raf = requestAnimationFrame(frame);
    }

    function stop() {
      live = false;
    }

    hero.addEventListener('mousemove', function (event) {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    });

    hero.addEventListener('mouseleave', function () {
      pointer = null;
      aim();
    });

    // Parallax has to keep up with the page, not just the pointer
    window.addEventListener('scroll', function () {
      if (live && raf === null) raf = requestAnimationFrame(frame);
    }, { passive: true });

    if (hasObserver) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start();
          else stop();
        });
      }).observe(hero);
    } else {
      start();
    }

    onResizeEnd(function () {
      heroTop = hero.getBoundingClientRect().top + window.pageYOffset;
      if (wide.matches) start();
      else stop();
      aim();
    }, 150);
  }


  /* ---------- Forms → Google Sheet ----------
     Both forms post to a Google Apps Script web app (backend/forms.gs)
     that appends a row to the submissions sheet. The body is form-encoded
     so the browser sends it without a CORS preflight, which Apps Script
     cannot answer. */
  var FORMS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbziI_2OEZY-ufzPrK1xTGadr_j4ds01j6MWr78D6oC3xQEhfaPAeD96shMkJlCQXFaw2w/exec';

  // Downloaded after the brochure form; empty shows the thank-you only
  var BROCHURE_URL = 'assets/yansa-brochure.pdf';

  // Bot trap, hidden from people and screen readers
  var HONEYPOT =
    '<input type="text" name="website" class="form-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';

  function sendForm(formName, form) {
    var data = new URLSearchParams(new FormData(form));
    data.append('form', formName);
    data.append('page', location.pathname.split('/').pop() || 'index.html');

    if (!FORMS_ENDPOINT) return Promise.reject(new Error('FORMS_ENDPOINT not set'));

    return fetch(FORMS_ENDPOINT, { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (out) {
        if (!out.ok) throw new Error(out.error || 'Submission failed');
      });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.insertAdjacentHTML('beforeend', HONEYPOT);
    var button = form.querySelector('button[type="submit"]');
    var status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.appendChild(status);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = '';
      status.classList.remove('form-status--error');

      sendForm('contact', form)
        .then(function () {
          form.reset();
          status.textContent = 'Thank you! We’ll be in touch shortly.';
        })
        .catch(function () {
          status.textContent = 'Something went wrong. Please try again, or email us directly.';
          status.classList.add('form-status--error');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = 'Send';
        });
    });
  }

  /* ---------- Brochure: details before download ----------
     Every "Download Brochure" link (a[data-brochure]) opens a small form;
     the details go to the sheet, then the PDF downloads. */
  function initBrochure() {
    var links = document.querySelectorAll('a[data-brochure]');
    if (!links.length || !window.HTMLDialogElement) return;

    var dialog = document.createElement('dialog');
    dialog.className = 'brochure-dialog';
    dialog.setAttribute('aria-labelledby', 'brochure-title');
    dialog.innerHTML =
      '<button type="button" class="brochure-dialog__close" aria-label="Close">&times;</button>' +
      '<form class="brochure-form">' +
        '<h2 id="brochure-title">Get the Brochure</h2>' +
        '<input type="text" name="name" autocomplete="name" required placeholder="Full name *" aria-label="Full name">' +
        '<input type="text" name="organisation" autocomplete="organization" required placeholder="Organisation name *" aria-label="Organisation name">' +
        '<input type="email" name="email" autocomplete="email" required placeholder="Work email *" aria-label="Work email">' +
        '<input type="tel" name="phone" autocomplete="tel" placeholder="Phone (optional)" aria-label="Phone">' +
        HONEYPOT +
        '<button type="submit" class="btn btn--orange">Download</button>' +
        '<p class="form-status form-status--error" role="status" hidden></p>' +
      '</form>' +
      '<div class="brochure-thanks" hidden>' +
        '<h2>Thank you!</h2>' +
        '<p>' + (BROCHURE_URL
          ? 'Your download will begin shortly. We’ve also emailed you a copy.'
          : 'We’ll send the brochure to your email shortly.') + '</p>' +
      '</div>';
    document.body.appendChild(dialog);

    var form = dialog.querySelector('form');
    var thanks = dialog.querySelector('.brochure-thanks');
    var button = form.querySelector('button[type="submit"]');
    var error = form.querySelector('.form-status');

    toArray(links).forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        form.reset();
        form.hidden = false;
        thanks.hidden = true;
        error.hidden = true;
        dialog.showModal();
      });
    });

    dialog.querySelector('.brochure-dialog__close').addEventListener('click', function () {
      dialog.close();
    });

    // A click on the backdrop lands on the dialog element itself
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    // Browser validation handles required fields and the email format
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      button.disabled = true;
      button.textContent = 'Sending…';
      error.hidden = true;

      sendForm('brochure', form)
        .then(function () {
          form.hidden = true;
          thanks.hidden = false;
          if (BROCHURE_URL) {
            var a = document.createElement('a');
            a.href = BROCHURE_URL;
            a.download = 'Yansa Brochure.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        })
        .catch(function () {
          error.textContent = 'Something went wrong. Please try again.';
          error.hidden = false;
        })
        .then(function () {
          button.disabled = false;
          button.textContent = 'Download';
        });
    });
  }


  /* ---------- Start ---------- */
  initCardMotion();
  initMeasureRotator();
  initValues();
  initProblems();
  initFooterMark();
  initSolutionDialog();
  initSolutionScroll();
  initMobileNav();
  initNavIndicator();
  initSymptomFocus();
  initFaq();
  initIndustryTabs();
  initNavAutoHide();
  initPqScroll();
  initSpotlight();
  initPqHover();
  initPqPills();
  initTypewriter();
  initHeroVideo();
  initHero();
  initScrollReveal();
  initQuote();
  initYanqFlow();
  initCaseStudies();
  initAboutDecor();
  initContactForm();
  initBrochure();

})();
