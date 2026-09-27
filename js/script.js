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
     The section is pinned and scroll position picks the value, so the
     sequence runs once, in order, at the reader's pace. The active value's
     bar widens and its neighbour takes a middle width; the copy fades out,
     is swapped while invisible, and fades back in.

     The panel also gets an entrance: armed while the previous section still
     fills the screen, so its contents rise into place as it arrives. The
     classes come off once that has played, as they would otherwise override
     the copy's own swap transition. */
  function initValues() {
    var values = document.querySelector('.about-values');
    if (!values) return;

    var track = values.querySelector('.about-values__bars');
    var bars = toArray(values.querySelectorAll('.value-bar'));
    var valueCopy = values.querySelector('.about-values__copy');
    var valueLive = values.querySelector('.about-values__live');
    var sticky = values.querySelector('.about-values__sticky');

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

    var FADE_MS = 300; // matches .about-values__copy's opacity transition
    var index = -1;    // -1 so the first pass always paints
    var swapTimer = null;

    function layout(active) {
      for (var i = 0; i < bars.length; i++) {
        var distance = Math.abs(i - active);
        bars[i].classList.toggle('is-active', distance === 0);
        bars[i].classList.toggle('is-near', distance === 1);
      }
    }

    function swapCopy(active) {
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
      if (valueLive) valueLive.textContent = VALUES[active].word;

      window.clearTimeout(swapTimer);

      if (first) {
        swapCopy(active);
        return;
      }

      valueCopy.classList.add('is-swapping');
      swapTimer = window.setTimeout(function () {
        swapCopy(active);
      }, FADE_MS);
    }

    /* The section is taller than the viewport by exactly the distance it
       stays pinned; that surplus divides evenly between the values. */
    function fromScroll() {
      var range = values.offsetHeight - window.innerHeight;
      if (range <= 0) return 0;
      var travelled = Math.min(Math.max(-values.getBoundingClientRect().top, 0), range);
      return Math.min(VALUES.length - 1, Math.floor((travelled / range) * VALUES.length));
    }

    // Seeded without transitions so the bars are in place on first view
    function seed() {
      track.classList.add('is-static');
      index = -1;
      show(fromScroll());
      void track.offsetWidth;
      track.classList.remove('is-static');
    }

    onResizeEnd(function () {
      valueCopy.style.height = '';
      seed();
    }, 200);

    seed();
    onScrollFrame(function () {
      show(fromScroll());
    });

    if (sticky && !reduceMotion && hasObserver) {
      values.classList.add('is-armed');
      onFirstView(sticky, 0.35, function () {
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


  /* ---------- Navbar: away going down, back coming up ----------
     Only the class is toggled; the slide is a CSS transition. Small
     movements are ignored so trackpad jitter cannot flicker it, and it
     always shows near the top of the page. */
  function initNavbarAutoHide() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var JITTER = 6;  // px of movement to ignore
    var TOP = 90;    // above this the bar is always shown
    var lastY = window.pageYOffset;

    onScrollFrame(function () {
      var y = window.pageYOffset;
      var delta = y - lastY;
      if (Math.abs(delta) < JITTER) return;

      navbar.classList.toggle('is-hidden', !(y < TOP || delta < 0));
      lastY = y;
    });
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
    var scrim = hero.querySelector('.hero__media-scrim');
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

      scrim.style.opacity = 1 - clamp01(e / 0.75);

      // The buttons belong to the settled state, so they arrive late
      var c = clamp01((e - 0.45) / 0.55);
      ctas.style.opacity = c;
      ctas.style.transform = 'translate3d(0, ' + ((1 - c) * 20).toFixed(2) + 'px, 0)';
    }

    // Hand every property back to the stylesheet
    function reset() {
      [media.style, heading.style, h1.style, sub.style, scrim.style, ctas.style].forEach(function (style) {
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
      { sel: '.yanq-works-intro__inner', step: 0 },
      { sel: '.yanq-step__title', step: 0 },
      { sel: '.yanq-step__text > *', step: 90 },
      { sel: '.yanq-step__illustration', step: 140 },
      { sel: '.yanq-delivers > h2, .yanq-delivers > p', step: 90 },
      { sel: '.yanq-delivers__grid > *', step: 80 },

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


  /* ---------- Quote: scroll-driven read-along (home) ----------
     As the paragraph travels from 75% to 28% of the viewport height, the
     rail fills and the words light one at a time (never part-way). */
  function initQuote() {
    var quote = document.querySelector('.quote');
    if (!quote || !quote.querySelector('.quote__stage')) return;

    var para = quote.querySelector('p');

    var DAMP = 0.16;
    var LEAD = 1;       // one word of extra travel, so the last one lights
    var START = 0.75;   // viewport fraction where the reveal begins
    var END = 0.28;     // and where it is complete

    var words = [];
    var target = 0;
    var current = 0;
    var raf = null;
    var on = false;

    // One span per word; the spaces stay as text so wrapping is unchanged
    var frag = document.createDocumentFragment();
    para.textContent.split(/(\s+)/).forEach(function (part) {
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
    para.innerHTML = '';
    para.appendChild(frag);

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
      if (reduceMotion || window.innerWidth <= 768) {
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
  initNavbarAutoHide();
  initNavIndicator();
  initSymptomFocus();
  initFaq();
  initTypewriter();
  initHero();
  initScrollReveal();
  initQuote();
  initCaseStudies();
  initAboutDecor();
  initContactForm();
  initBrochure();

})();
