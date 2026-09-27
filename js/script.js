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

    // True when the gesture was spent on the panel rather than the page
    function jack(dir) {
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


  /* ---------- Home hero: scroll-driven reveal ----------
     Adds .is-scrolly, which pins the stage and lifts the media out of its
     frame, then drives it from full bleed back into the frame as the page
     scrolls. The page's own scroll bar drives it (sticky, never a wheel
     hijack). The end state is measured from .hero__frame-slot, so progress
     1 lands exactly on the designed layout, and scroll is followed with a
     damped lerp so a coarse wheel notch glides. */
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero || !hero.querySelector('.hero__frame-slot')) return;

    var stage = hero.querySelector('.hero__stage');
    var heading = hero.querySelector('.hero__heading');
    var h1 = heading.querySelector('h1');
    var sub = heading.querySelector('p');
    var slot = hero.querySelector('.hero__frame-slot');
    var media = hero.querySelector('.hero__media');
    var ctas = hero.querySelector('.hero__ctas');

    var HEAD_SCALE = 1.55; // heading size at full bleed, relative to final
    var RADIUS = 10;
    var BORDER = 10;
    var DAMP = 0.16;

    var geo = null;
    var target = 0;
    var current = 0;
    var raf = null;
    var on = false;

    // Slow in, slow out: the motion never arrives at a hard stop
    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function mix(from, to, t) {
      return 'rgb(' +
        Math.round(lerp(from[0], to[0], t)) + ',' +
        Math.round(lerp(from[1], to[1], t)) + ',' +
        Math.round(lerp(from[2], to[2], t)) + ')';
    }

    function measure() {
      // Measure the heading untransformed, or this reads back its own offset
      var prevTransform = heading.style.transform;
      heading.style.transform = 'none';

      var stageRect = stage.getBoundingClientRect();
      var slotRect = slot.getBoundingClientRect();
      var headRect = heading.getBoundingClientRect();

      heading.style.transform = prevTransform;

      geo = {
        stageW: stageRect.width,
        stageH: stageRect.height,
        boxLeft: slotRect.left - stageRect.left,
        boxTop: slotRect.top - stageRect.top,
        boxW: slotRect.width,
        boxH: slotRect.height,
        // how far the heading must rise to sit centred in the stage
        headShift: stageRect.height / 2 - (headRect.top - stageRect.top + headRect.height / 2)
      };
    }

    function apply(p) {
      if (!geo) return;
      var e = ease(p);

      media.style.left = lerp(0, geo.boxLeft, e) + 'px';
      media.style.top = lerp(0, geo.boxTop, e) + 'px';
      media.style.width = lerp(geo.stageW, geo.boxW, e) + 'px';
      media.style.height = lerp(geo.stageH, geo.boxH, e) + 'px';
      media.style.borderRadius = lerp(0, RADIUS, e) + 'px';
      media.style.borderWidth = lerp(0, BORDER, e) + 'px';
      media.style.boxShadow =
        '0 0 0 1px rgba(0, 0, 0, ' + (0.2 * e).toFixed(3) + '), ' +
        '0 2px 8px rgba(0, 0, 0, ' + (0.12 * e).toFixed(3) + ')';

      heading.style.transform =
        'translate3d(0, ' + lerp(geo.headShift, 0, e).toFixed(2) + 'px, 0) ' +
        'scale(' + lerp(HEAD_SCALE, 1, e).toFixed(4) + ')';

      h1.style.color = mix([255, 255, 255], [0, 127, 127], e);
      sub.style.color = mix([255, 255, 255], [21, 21, 21], e);

      // The buttons belong to the settled state, so they arrive late
      var c = clamp01((e - 0.45) / 0.55);
      ctas.style.opacity = c;
      ctas.style.transform = 'translate3d(0, ' + ((1 - c) * 20).toFixed(2) + 'px, 0)';
    }

    // Hand every property back to the stylesheet
    function reset() {
      [media.style, heading.style, h1.style, sub.style, ctas.style].forEach(function (style) {
        style.left = '';
        style.top = '';
        style.width = '';
        style.height = '';
        style.borderRadius = '';
        style.borderWidth = '';
        style.boxShadow = '';
        style.transform = '';
        style.color = '';
        style.opacity = '';
      });
    }

    function progress() {
      var runway = hero.offsetHeight - geo.stageH;
      if (runway <= 0) return 1;
      var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
      return clamp01((stuckAt - hero.getBoundingClientRect().top) / runway);
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
      if (reduceMotion || window.innerWidth <= 768) {
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
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });

    onResizeEnd(sync, 120);

    // The frame's height depends on the media, so re-measure once loaded
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
      { sel: '.industries__grid > *', step: 70 },
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
    var ORANGE = [255, 140, 64];    // --orange, for "YanQ"

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
      flow.style.setProperty('--yanq-flow-brand', mix(INK, ORANGE, turn, 1 - swap));
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
  var FORMS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby1FseYxoZf98idb1vlxApBTynyOCM12i5B3SKHmHeEEYV1xkUWQpcnin7PoLonbN95UA/exec';

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
  initMobileNav();
  initNavIndicator();
  initSymptomFocus();
  initFaq();
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
