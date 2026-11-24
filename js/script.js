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
     frame so the card settles like a spring. The Why Yansa cards are links
     now and lift by CSS (a 4px rise), so they are not handled here. */
  function initCardMotion() {
    if (reduceMotion) return;

    var MAX_TILT = 3;
    var HOVER_SCALE = 1.012;
    var EASE = 0.12;

    toArray(document.querySelectorAll('.symptom-card')).forEach(function (card) {
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


  /* ---------- Load explorer (Know Your Loads) ----------
     Eight loads as ARIA tabs (roving tabindex; arrows, Home and End pick
     and focus). A pick swaps .is-active on the matching item in the Problem
     and Solution columns: the crossfade is CSS (they share a grid cell, so
     the board never changes height). It also replays the load's drawing
     (.is-play) and pulses the two connectors. .is-live is set at the first
     pick so nothing animates on load. Under reduced motion the CSS drops all
     movement, so there is nothing to restart here. On a narrow screen the
     loads form a scrolling chip row; the picked chip is kept in view. */
  function initLoadExplorer() {
    var board = document.querySelector('.loads-x__board');
    if (!board) return;

    var list = board.querySelector('.loads-x__list');
    var panel = board.querySelector('.loads-x__panel');
    var tabs = toArray(board.querySelectorAll('.loads-x__load'));
    var items = toArray(board.querySelectorAll('.loads-x__item'));
    var arts = toArray(board.querySelectorAll('.loads-x__art'));
    var current = Math.max(0, tabs.map(function (t) { return t.classList.contains('is-active'); }).indexOf(true));

    // Restart a one-shot CSS animation by dropping and re-adding its class
    function replay(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function keepInView(tab) {
      if (list.scrollWidth <= list.clientWidth + 1) return;
      var l = list.getBoundingClientRect();
      var t = tab.getBoundingClientRect();
      list.scrollBy({
        left: t.left - l.left - (l.width - t.width) / 2,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }

    function select(i, focus) {
      if (i < 0 || i >= tabs.length) return;
      if (focus) tabs[i].focus();
      if (i === current) return;
      var id = tabs[i].getAttribute('data-load');
      tabs.forEach(function (tab, k) {
        var on = k === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) tab.removeAttribute('tabindex');
        else tab.setAttribute('tabindex', '-1');
      });
      items.forEach(function (item) {
        item.classList.toggle('is-active', item.getAttribute('data-load') === id);
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      arts.forEach(function (art) { art.classList.remove('is-play'); });
      var art = board.querySelector('.loads-x__item.is-active .loads-x__art');
      board.classList.add('is-live');
      if (!reduceMotion) {
        replay(board, 'is-pulse');
        if (art) replay(art, 'is-play');
      }
      keepInView(tabs[i]);
      current = i;
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
    });

    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      e.preventDefault();
      select(next, true);
    });

    // The loads read as a row when the board narrows (CSS, 1100px)
    var row = window.matchMedia('(max-width: 1100px)');
    function orient() { list.setAttribute('aria-orientation', row.matches ? 'horizontal' : 'vertical'); }
    orient();
    if (row.addEventListener) row.addEventListener('change', orient);
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
     Below 769px the links live in a drop-down panel behind the menu
     button. It closes when a link is chosen, on Escape (returning focus to
     the button), on a tap outside the bar, and if the window grows past the
     breakpoint. */
  function initMobileNav() {
    var navbar = document.querySelector('.navbar');
    var toggle = navbar && navbar.querySelector('.navbar__toggle');
    if (!toggle) return;

    var wide = window.matchMedia('(min-width: 769px)');

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

    // Only the top-level labels get the underline, not the drop-down children
    var tops = toArray(links.querySelectorAll(':scope > a, :scope > .nav-item > .nav-item__link'));
    var active = links.querySelector(':scope > a.is-active, :scope > .nav-item > a.is-active');

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

    tops.forEach(function (link) {
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


  /* ---------- Navbar: drop-downs ----------
     Solutions and Services each carry a panel. It opens on hover (a short
     close delay lets the pointer travel across) and on keyboard focus; the
     chevron button toggles it (aria-expanded); Escape closes it and returns
     focus; a click outside closes it. The fade is CSS, and reduced motion
     turns it off there. Below 769px the phone menu lists the children. */
  function initNavMenus() {
    var items = toArray(document.querySelectorAll('.navbar__links .nav-item'));
    if (!items.length) return;
    var desktop = window.matchMedia('(min-width: 769px)');
    var CLOSE_DELAY = 150;

    items.forEach(function (item) {
      var chev = item.querySelector('.nav-item__chev');
      var panel = item.querySelector('.nav-menu');
      if (!chev || !panel) return;
      var timer = 0;
      var quiet = false;   // true while Escape hands focus back, so that focus does not reopen it

      function setOpen(open) {
        window.clearTimeout(timer);
        item.classList.toggle('is-open', open);
        chev.setAttribute('aria-expanded', String(open));
      }

      function closeSoon() {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { setOpen(false); }, CLOSE_DELAY);
      }

      item.addEventListener('mouseenter', function () {
        if (desktop.matches) setOpen(true);
      });
      item.addEventListener('mouseleave', function () {
        if (desktop.matches) closeSoon();
      });

      // Keyboard focus opens it; a mouse click on the chevron is the toggle's job
      item.addEventListener('focusin', function (event) {
        if (!desktop.matches || quiet) return;
        var el = event.target;
        if (el.matches && el.matches(':focus-visible')) setOpen(true);
      });
      item.addEventListener('focusout', function (event) {
        if (!item.contains(event.relatedTarget)) closeSoon();
      });

      // Toggle from the state at press time: on a touch screen the tap's
      // hover would already have opened it by the time the click lands
      var wasOpen = null;
      chev.addEventListener('pointerdown', function () {
        wasOpen = item.classList.contains('is-open');
      });
      chev.addEventListener('click', function () {
        var open = wasOpen === null ? item.classList.contains('is-open') : wasOpen;
        wasOpen = null;
        setOpen(!open);
      });

      item.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape' || !item.classList.contains('is-open')) return;
        var inside = item.contains(document.activeElement);
        setOpen(false);
        if (inside) {
          quiet = true;
          chev.focus();
          quiet = false;
        }
      });

      // A chosen child closes the panel (same-page anchors keep the page)
      toArray(panel.querySelectorAll('a')).forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
      });

      document.addEventListener('click', function (event) {
        if (item.classList.contains('is-open') && !item.contains(event.target)) setOpen(false);
      });
    });

    var onChange = function () {
      if (!desktop.matches) {
        items.forEach(function (item) {
          item.classList.remove('is-open');
          var chev = item.querySelector('.nav-item__chev');
          if (chev) chev.setAttribute('aria-expanded', 'false');
        });
      }
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  }


  /* ---------- Symptom cards: keyboard access ----------
     The detail reveal is pure CSS; a tab stop lets a keyboard open it
     through :focus-within. */
  function initSymptomFocus() {
    toArray(document.querySelectorAll('.symptom-card')).forEach(function (card) {
      card.setAttribute('tabindex', '0');
    });
  }


  /* ---------- Symptom drawings ----------
     Each symptom card holds a small line drawing (.sym-art, drawn in CSS to
     its failure frame). Here the card is put on the start frame (.is-armed)
     and released the first time it is half in view, so the drawing plays by
     transition (breaker trips, motor heats, meter climbs, gauge falls).
     While a mouse hovers the card, the drawing winds back and plays again
     every few seconds; on leaving it settles on the finished frame. A
     keyboard focus replays it once. Touch has no hover, so it only plays on
     entering view. Reduced motion never arms the card: the finished frame
     just shows. */
  function initSymptomArt() {
    var cards = toArray(document.querySelectorAll('.symptom-card'));
    if (!cards.length || reduceMotion || !hasObserver) return;

    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var WIND = 450;    // ms for the drawing to wind back to its start frame
    var EVERY = 3400;  // ms between replays while hovered

    cards.forEach(function (card) {
      if (!card.querySelector('.sym-art')) return;
      var seen = false;
      var timer = null;

      function arm() {
        card.classList.remove('is-play');
        card.classList.add('is-armed');
      }

      function play() {
        card.classList.remove('is-armed');
        card.classList.add('is-play');
      }

      // Wind back, play, wait, repeat: only while the pointer stays on the card
      function loop() {
        arm();
        timer = window.setTimeout(function () {
          play();
          timer = window.setTimeout(loop, EVERY);
        }, WIND);
      }

      function stop() {
        window.clearTimeout(timer);
        timer = null;
      }

      arm();
      onFirstView(card, 0.5, function () {
        seen = true;
        play();
      });

      if (canHover) {
        card.addEventListener('mouseenter', function () {
          if (!seen) return;
          stop();
          loop();
        });
        card.addEventListener('mouseleave', function () {
          if (!seen) return;
          stop();
          play();
        });
      }

      card.addEventListener('focusin', function () {
        if (!seen || timer) return;
        arm();
        timer = window.setTimeout(function () {
          timer = null;
          play();
        }, WIND);
      });
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
        // The small waves hold still, drawn clean (client request, 12 Oct)
        it.waves.forEach(function (svg) { draw(svg, 1, 0); });
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

  /* ---------- Solutions hero: the wave that gets corrected ----------
     One SVG line along the foot of the hero. It opens as a distorted wave (a
     fundamental plus 5th and 7th harmonics, irregular in height) and settles
     into a clean sine over SETTLE ms, easing out, its colour going from the
     site's orange to cyan as it cleans up. After that, a mouse moving over the
     hero re-distorts the line round the pointer (a gaussian bump) and the line
     corrects it again over DECAY ms, as the filter would.
     Nothing runs on a timer: the frame loop starts when there is something to
     change (the first settle, a pointer move) and stops the moment the line is
     clean again, so an idle hero costs no frames. The path is plain JS; the
     markup carries a clean sine for no-JS and first paint. Under reduced
     motion the line is clean and static. Touch input is ignored, so phones
     get the settle only. */
  function initPqWave() {
    var hero = document.querySelector('.pqs-hero');
    var svg = hero && hero.querySelector('.pqs-wave');
    if (!svg) return;

    var line = svg.querySelector('.pqs-wave__line');
    var glow = svg.querySelector('.pqs-wave__glow');
    var ref = svg.querySelector('.pqs-wave__ref');
    var grad = svg.querySelector('linearGradient');

    var SETTLE = 1600;   // ms from distorted to clean
    var DECAY = 600;     // ms for a pointer bump to correct itself
    var STEP = 5;        // px between path points
    var STOPS = 28;      // colour stops along the gradient
    var MAX_BUMPS = 24;

    var NS = 'http://www.w3.org/2000/svg';
    var stops = [];
    for (var i = 0; i <= STOPS; i++) {
      var stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', (i / STOPS * 100).toFixed(2) + '%');
      stops.push(stop);
    }
    while (grad.firstChild) grad.removeChild(grad.firstChild);
    stops.forEach(function (stop) { grad.appendChild(stop); });

    var w = 0;
    var h = 0;
    var mid = 0;
    var amp = 0;
    var k = 0;
    var sigma = 80;
    var t0 = performance.now();
    var bumps = [];
    var raf = null;

    function size() {
      w = svg.clientWidth || 1440;
      h = svg.clientHeight || 150;
      mid = h / 2;
      amp = h * 0.2;
      k = Math.PI * 2 * (w < 600 ? 2.2 : w / 380) / w;
      sigma = Math.max(60, Math.min(110, w * 0.07));
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      grad.setAttribute('x2', w);
      var d = 'M0 ' + mid.toFixed(1);
      for (var x = 0; x <= w + STEP; x += STEP) {
        d += 'L' + x + ' ' + (mid - amp * Math.sin(k * x)).toFixed(1);
      }
      ref.setAttribute('d', d);
    }

    // How far off clean the line is at x (0 clean, 1 fully distorted)
    function weight(x, settle, now) {
      var d = settle;
      for (var b = 0; b < bumps.length; b++) {
        var life = 1 - (now - bumps[b].t) / DECAY;
        if (life <= 0) continue;
        var dx = (x - bumps[b].x) / sigma;
        d += bumps[b].s * life * life * Math.exp(-dx * dx / 2);
      }
      return d > 1.15 ? 1.15 : d;
    }

    function draw(now) {
      var u = Math.max(0, Math.min(1, (now - t0) / SETTLE));
      var settle = reduceMotion ? 0 : Math.pow(1 - u, 3);   // ease-out: distortion leaves fast, then tails off
      var tt = (now - t0) / 1000;
      bumps = bumps.filter(function (b) { return now - b.t < DECAY; });

      var path = '';
      for (var x = 0; x <= w + STEP; x += STEP) {
        var d = weight(x, settle, now);
        // the fundamental swells and sags irregularly, with the 5th and 7th riding on it
        var swell = 1 + d * (0.3 * Math.sin(k * x * 0.43 + 1.2) + 0.15 * Math.sin(k * x * 1.1 + 0.4));
        var h5 = 0.28 * Math.sin(5 * k * x + 0.9 + tt * 5) * (0.6 + 0.4 * Math.sin(k * x * 0.7 + 2));
        var h7 = 0.2 * Math.sin(7 * k * x + 2.1 - tt * 6) * (0.6 + 0.4 * Math.sin(k * x * 0.9));
        var y = mid - amp * (Math.sin(k * x) * swell + d * (h5 + h7));
        path += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      line.setAttribute('d', path);
      glow.setAttribute('d', path);

      for (var i = 0; i < stops.length; i++) {
        var pct = Math.round(Math.min(1, weight(i / STOPS * w, settle, now)) * 100);
        stops[i].style.stopColor = 'color-mix(in srgb, var(--orange) ' + pct + '%, var(--cyan))';
      }
      return settle > 0.001 || bumps.length > 0;
    }

    function tick(now) {
      raf = draw(now) ? requestAnimationFrame(tick) : null;
    }

    function wake() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    size();
    draw(t0);   // first paint is already the distorted line (clean under reduced motion)

    if (!reduceMotion) {
      wake();

      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var r = svg.getBoundingClientRect();
        var hr = hero.getBoundingClientRect();
        var x = e.clientX - r.left;
        if (x < -sigma || x > w + sigma) return;
        // a pointer nearer the line disturbs it a little more
        var s = 0.55 + 0.45 * Math.max(0, Math.min(1, (e.clientY - hr.top) / hr.height));
        var now = performance.now();
        var last = bumps[bumps.length - 1];
        if (last && Math.abs(last.x - x) < 18) {
          last.t = now;
          last.x = x;
          last.s = s;
        } else {
          bumps.push({ x: x, t: now, s: s });
          if (bumps.length > MAX_BUMPS) bumps.shift();
        }
        wake();
      });
    }

    onResizeEnd(function () {
      size();
      draw(performance.now());
    }, 120);
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
        '.hero.is-scrolly .hero__stage, .cases.is-scrolly .cases__stage'
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
     A tablist over one table. The table is built here from the fallback
     cards in the markup, so the copy lives in one place. Roving tabindex:
     Tab reaches the row once, arrows, Home and End move within it.
     A 2px bar under the row slides to the chosen tab (transform only).
     Choosing a tab fades the table out, sets the new words and layout (3 or
     2 across, the last row stretching), and fades it back in with a 6px
     rise. The table's height is reserved for the tallest category, so the
     page below never moves. Under reduced motion, or without the Web
     Animations API, it just swaps. */
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
    // reduce, and the spare marker sits on the other and shrinks away.
    var pluses = [0, 1].map(function () {
      var el = document.createElement('span');
      el.className = 'industry-plus';
      el.setAttribute('aria-hidden', 'true');
      grid.appendChild(el);
      return el;
    });
    holder.appendChild(grid);

    // One bar under the row that slides to the chosen tab. It is 1px wide
    // and scaled, so only transform changes.
    var list = box.querySelector('.industry-tabs__list');
    var bar = document.createElement('span');
    bar.className = 'industry-tabs__bar';
    bar.setAttribute('aria-hidden', 'true');
    list.appendChild(bar);

    function moveBar(instant) {
      var tab = tabs[current];
      if (!tab) return;
      if (instant) bar.style.transition = 'none';
      bar.style.transform = 'translateX(' + tab.offsetLeft + 'px) scaleX(' + tab.offsetWidth + ')';
      if (instant) {
        void bar.offsetWidth;
        bar.style.transition = '';
      }
    }

    var narrow = window.matchMedia('(max-width: 560px)');
    var animated = !reduceMotion && typeof grid.animate === 'function';
    var current = 0;
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

    // Show n cells on the six-column track
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

    // Where the lines cross, from the cells' layout boxes: the dividers shared
    // by two neighbouring rows. Where rows do not line up (a stretched last
    // row) the crossing merges into one, at the lower row's divider.
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

    function place() {
      var spots = crossings();
      var rest = spots.length ? spots[spots.length - 1] : { x: grid.clientWidth / 2, y: grid.clientHeight / 2 };
      pluses.forEach(function (el, k) {
        var spot = spots[k];
        el.style.setProperty('--px', (spot || rest).x + 'px');
        el.style.setProperty('--py', (spot || rest).y + 'px');
        el.style.setProperty('--ps', spot ? '1' : '0');
      });
    }

    function apply(index) {
      setWords(data[index]);
      layout(data[index].length);
      place();
    }

    // The table is as tall as its tallest category at this width, so
    // switching never moves what is below. Each category is laid out once
    // to measure it, then the current one is put back.
    function reserve() {
      grid.style.minHeight = '';
      var tallest = 0;
      data.forEach(function (_, k) {
        setWords(data[k]);
        layout(data[k].length);
        tallest = Math.max(tallest, grid.offsetHeight);
      });
      grid.style.minHeight = tallest + 'px';
      apply(current);
    }

    // Fade out, swap while invisible, fade in rising 6px
    function swap(index) {
      var mine = ++seq;
      running.forEach(function (anim) { anim.cancel(); });
      running = [];

      var out = grid.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(0)' }],
        { duration: 130, easing: 'ease-out', fill: 'forwards' }
      );
      running.push(out);
      out.finished.then(function () {
        if (mine !== seq) return;
        apply(index);
        running.forEach(function (anim) { anim.cancel(); });
        running = [grid.animate(
          [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        )];
      }, function () {});
    }

    function choose(index) {
      if (index === current) return;
      current = index;
      select(index);
      if (animated) swap(index);
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

    // 3 across becomes 2 across on a phone, and line breaks change with the
    // width: re-lay out and re-measure, no animation
    var onSize = function () {
      seq++;
      running.forEach(function (anim) { anim.cancel(); });
      running = [];
      reserve();
    };
    if (narrow.addEventListener) narrow.addEventListener('change', onSize);
    else if (narrow.addListener) narrow.addListener(onSize);
    onResizeEnd(onSize, 200);

    if (window.ResizeObserver) {
      new ResizeObserver(function () { place(); }).observe(grid);
    }

    // Keep the bar on its tab when the row changes width (resize, web font)
    if (window.ResizeObserver) {
      new ResizeObserver(function () { moveBar(true); }).observe(list);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { moveBar(true); reserve(); });
    }

    select(0);
    reserve();
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


  /* ---------- Home hero: scroll-driven sequence ----------
     Adds .is-scrolly, which pins the stage, then plays one scrubbed timeline
     (p, 0 to 1) as the page scrolls. The page's own scroll bar drives it
     (sticky, never a wheel hijack), followed with a damped lerp so a coarse
     wheel notch glides. The runway is 90vh (--hero-runway), so the whole hero
     is 1.8 screens and the stages overlap more than they once did:
       0    to 0.18  the navbar and the heading fade away together, leaving
                     the still bare. The still does not move. It already
                     reaches up under the navbar, so nothing shifts as the
                     navbar goes (it comes back once the hero is scrolled past)
       0.18 to 0.20  a beat with just the still
       0.20 to 0.56  the still shrinks to a card
       0.34 to 0.78  the card lifts to the top; four photos slide out from
                     BEHIND it (the card is in front of them)
       0.78 to 0.98  the description and buttons arrive under the card
       0.88 on       the photos and the card drift with the cursor
     Through the whole runway the still itself eases from a 1.06 zoom to 1,
     a pure function of p, so a still picture never reads as frozen.
     Not run under reduced motion, on phones, or on screens too short to
     hold the whole end state; those get the plain stack. */
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero || !hero.querySelector('.hero__float')) return;

    var navbar = document.querySelector('.navbar');
    var stage = hero.querySelector('.hero__stage');
    var media = hero.querySelector('.hero__media');
    var still = media.querySelector('img');
    var heading = hero.querySelector('.hero__heading');
    var desc = hero.querySelector('.hero__desc');
    var floats = toArray(hero.querySelectorAll('.hero__float'));

    // Where each photo rests: x as a fraction of the stage width, y as a
    // fraction of the card's height, both from the card's centre; when it
    // starts; its width at 1440px; and how far the cursor moves it. The lower
    // ones stay shallow so they keep clear of the text under the card.
    var SPOTS = [
      { x: -0.33, y: -0.16, at: 0.36, w: 200, drift: 0.12 },
      { x: 0.33, y: -0.16, at: 0.41, w: 200, drift: 0.08 },
      { x: -0.17, y: 0.30, at: 0.46, w: 170, drift: 0.15 },
      { x: 0.17, y: 0.30, at: 0.51, w: 170, drift: 0.10 }
    ];
    var PHOTO_LEN = 0.40;  // how much of p each photo takes to arrive
    var STILL_ZOOM = 1.06; // the still's scale at p = 0, easing to 1 at p = 1
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
      var fade = clamp01(p / 0.18);
      var shrink = ease(clamp01((p - 0.20) / 0.36));
      var lift = ease(clamp01((p - 0.34) / 0.44));
      var drift = clamp01((p - 0.88) / 0.12);
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
      if (still) still.style.transform = 'scale(' + lerp(STILL_ZOOM, 1, p).toFixed(4) + ')';

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
        var t = ease(clamp01((p - spot.at) / PHOTO_LEN));
        var fw = spot.w * geo.scale;
        var fh = fw * 0.75;
        var x = geo.W / 2 + spot.x * geo.W * t + dx * spot.drift * DRIFT_PX - fw / 2;
        var y = cy + spot.y * geo.cardH * t + dy * spot.drift * DRIFT_PX - fh / 2;
        el.style.width = fw.toFixed(2) + 'px';
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0) ' +
          'scale(' + lerp(0.8, 1, t).toFixed(4) + ')';
      });

      var d = clamp01((p - 0.78) / 0.20);
      desc.style.opacity = d.toFixed(3);
      desc.style.visibility = d <= 0 ? 'hidden' : '';
      desc.style.top = (cy + h / 2 + TEXT_GAP + cardY).toFixed(2) + 'px';
      desc.style.transform = 'translate3d(-50%, ' + ((1 - d) * 24).toFixed(2) + 'px, 0)';
    }

    // Hand every property back to the stylesheet
    function reset() {
      [media, still, heading, desc].concat(floats).forEach(function (el) {
        if (!el) return;
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
      if (target > 0.88) kick();
    });

    onResizeEnd(sync, 120);

    // The stage's size depends on the media, so re-measure once loaded
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
      { sel: '.loads-x h2', step: 0 },
      { sel: '.loads-x__board', step: 0 },
      { sel: '.problems__sticky > h2', step: 0 },
      { sel: '.solutions-row__inner > h2, .solutions-row__inner > p', step: 90 },
      { sel: '.solutions-row__grid > *', step: 90 },
      { sel: '.inaction__inner > h2, .inaction__inner > p', step: 90 },
      { sel: '.inaction__grid > *', step: 90 },
      { sel: '.results__inner > h2, .results__inner > p', step: 90 },
      { sel: '.results__list > *', step: 70 },

      /* YanQ */
      { sel: '.yanq-hero__content > *', step: 90 },
      { sel: '.yanq-delivers > h2', step: 0 },
      /* PQ Solved */
      { sel: '.pq-entry__copy > *', step: 90 },

      /* Solutions */
      { sel: '.pqs-intro h2', step: 0 },
      { sel: '.offered h2, .offered__inner > p', step: 90 },
      { sel: '.offered__grid > *', step: 80, mode: 'fade' },

      /* contact */
      { sel: '.contact-map', step: 0 },
      { sel: '.contact-form-col > *', step: 80 },

      /* footer, every page */
      { sel: '.footer__cta > *', step: 90, mode: 'fade' },
      { sel: '.footer__bottom > *', step: 110 }
    ];

    // What YanQ Delivers cards: phones animate these themselves (js/m/yanq.js)
    if (window.matchMedia('(min-width: 769px)').matches) {
      SETS.push({ sel: '.yanq-delivers__grid > *', step: 90, mode: 'fade' });
    }

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
     its own on/off test and a damping of 1 for a pure scroll mapping. */
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
     caller works out; initYanqWorks plays each box on its own clock.
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


  /* ---------- How YanQ Works: four boxes, played once (YanQ) ----------
     Four boxes joined by arrows, each holding one of the supplied process
     drawings. A plain section: nothing is pinned or scroll-linked. Once the
     row is about 35% into the viewport the boxes play in order:
       box fades in and rises 16px, its drawing plays 0 to 1 through
       renderDiagram (about 1.1s, ease-out), then its arrow draws (0.3s),
       and the next box starts a little before that arrow ends (~5s in all).
     On phones the boxes are stacked and each plays on its own as it enters
     view. After a drawing has finished, its [data-osc] wave keeps a slow,
     subtle loop, but only while the box is on screen.
     Every drawing ends on its own finished frame (renderDiagram at 1), the
     same under reduced motion, which just shows it with no play and no loop.
     Without JS the stylesheet already shows the boxes finished, as the SVGs
     are written. Only opacity, transform and stroke-dashoffset change, and
     the boxes reserve their size, so nothing shifts the layout. */
  function initYanqWorks() {
    var works = document.querySelector('.yanq-works');
    if (!works) return;

    var boxes = toArray(works.querySelectorAll('.yanq-step'));
    if (!boxes.length) return;

    // Reduced motion (or no observer): settle every drawing on its finished
    // frame and stop. Nothing is armed, so nothing is ever hidden.
    var finishedOnly = reduceMotion || !hasObserver;

    var BOX_MS = 100;      // the drawing starts just after the box begins to rise
    var DRAW_MS = 1100;    // drawing 0 to 1
    var ARROW_MS = 300;    // arrow draws after its drawing
    var STEP_MS = 1200;    // next box starts this long after the previous one
    var END_MS = BOX_MS + DRAW_MS + ARROW_MS;
    var OSC_MS = 9000;     // one period of the slow wave loop

    var phone = window.matchMedia('(max-width: 768px)');

    var parts = boxes.map(function (box) {
      var svg = box.querySelector('svg.yanq-diagram');
      var arrow = box.querySelector('.yanq-arrow');
      return {
        box: box,
        d: svg ? prepareDiagram(svg) : null,
        arrow: arrow,
        arrowParts: toArray(box.querySelectorAll('[data-arrow]')).map(function (el) {
          var span = (el.getAttribute('data-span') || '0,1').split(',');
          return { el: el, a: +span[0], b: +span[1] };
        }),
        t0: null,        // when its play starts (ms, performance.now clock)
        done: false,
        doneAt: 0,
        visible: false
      };
    });

    function setArrow(p, a) {
      p.arrowParts.forEach(function (part) {
        // A part may own a slice of the draw (the tablet elbow's three pieces)
        var v = clamp01((a - part.a) / (part.b - part.a));
        part.el.style.strokeDasharray = '1';
        part.el.style.strokeDashoffset = 1 - v;
        part.el.style.opacity = v > 0 ? 1 : 0;
      });
    }

    // One frame of a drawing. The drift dots (loose points around the
    // funnel) ease down to 35% over the last of the play, so the finished
    // frame is led by the funnel and the clean wave; reduced motion gets the
    // same finished frame.
    function drawFrame(p, L) {
      if (!p.d) return;
      renderDiagram(p.d, L, 0);
      p.d.els.forEach(function (o) {
        if (o.type !== 'drift') return;
        o.el.style.opacity = clamp01(L / 0.1) * (1 - 0.65 * clamp01((L - 0.6) / 0.4));
      });
    }

    function finish(p) {
      drawFrame(p, 1);
      setArrow(p, 1);
      p.box.classList.add('is-in');
    }

    if (finishedOnly) {
      parts.forEach(function (p) { drawFrame(p, 1); });
      return;
    }

    // Armed: hide what will play (the drawings at 0, arrows undrawn)
    works.classList.add('is-armed');
    parts.forEach(function (p) {
      if (p.d) renderDiagram(p.d, 0, 0);
      setArrow(p, 0);
    });

    var raf = null;

    function easeOut(v) {
      return 1 - Math.pow(1 - v, 3);
    }

    function frame(now) {
      raf = null;
      var again = false;

      parts.forEach(function (p) {
        if (p.t0 === null) return;

        if (!p.done) {
          var t = now - p.t0;
          again = true;
          if (t < 0) return;
          if (t >= END_MS) {
            finish(p);
            p.done = true;
            p.doneAt = now;
            return;
          }
          p.box.classList.add('is-in');
          drawFrame(p, easeOut(clamp01((t - BOX_MS) / DRAW_MS)));
          setArrow(p, clamp01((t - BOX_MS - DRAW_MS) / ARROW_MS));
        } else if (p.visible && p.d && p.d.osc.length) {
          var phase = (now - p.doneAt) / OSC_MS;
          p.d.osc.forEach(function (el) {
            var period = +el.getAttribute('data-osc');
            el.style.transform = 'translateX(' + (-(phase * period % period)) + 'px)';
          });
          again = true;
        }
      });

      if (again) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (raf === null) raf = requestAnimationFrame(frame);
    }

    // Desktop: the row starts the whole sequence, box after box
    function startRow() {
      var base = performance.now();
      var k = 0;
      parts.forEach(function (p) {
        if (p.t0 !== null) return;
        p.t0 = base + k * STEP_MS;
        k += 1;
      });
      kick();
    }

    // Phone: each box starts as it enters view
    function startBox(p) {
      if (p.t0 !== null) return;
      p.t0 = performance.now();
      kick();
    }

    // "Reached" also covers a box already scrolled past (a reload or an
    // anchor jump), which an intersection test would never report
    function reached(entry) {
      return entry.isIntersecting || entry.boundingClientRect.top < 0;
    }

    var row = works.querySelector('.yanq-works__row');
    var rowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (phone.matches || !reached(entry)) return;
        rowObserver.unobserve(entry.target);
        startRow();
      });
    }, { rootMargin: '0px 0px -35% 0px' });
    rowObserver.observe(row);

    var boxObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var p = parts[boxes.indexOf(entry.target)];
        if (!p || phone.matches === false) return;
        if (reached(entry)) startBox(p);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    boxes.forEach(function (box) { boxObserver.observe(box); });

    // Crossing 768px before the row has played: arm the other mode, starting
    // whatever is already far enough up the screen
    phone.addEventListener('change', function () {
      var vh = window.innerHeight;
      if (phone.matches) {
        parts.forEach(function (p) {
          if (p.box.getBoundingClientRect().top < vh * 0.85) startBox(p);
        });
      } else if (row.getBoundingClientRect().top < vh * 0.65) {
        rowObserver.unobserve(row);
        startRow();
      }
    });

    // The loop only runs while a finished box is actually on screen
    var viewObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var p = parts[boxes.indexOf(entry.target)];
        if (!p) return;
        p.visible = entry.isIntersecting;
        if (p.visible && p.done) kick();
      });
    });
    boxes.forEach(function (box) { viewObserver.observe(box); });
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


  /* ---------- Services: blocks and engagement row ----------
     Each service block arrives once as it enters view (photo settles from
     1.04, text rises 16px; CSS transitions, transform/opacity only). The
     Learn More buttons toggle .is-open on their block; the panel itself is a
     grid row that CSS takes from 0fr to 1fr. #commissioning and #amc open
     their block on load and when the hash changes (nav menu, step links).
     Reduced motion: everything in its final state, nothing animates. */
  function initServices() {
    var blocks = toArray(document.querySelectorAll('.svc-block'));
    if (!blocks.length) return;

    document.documentElement.classList.add('js-svc');

    function setOpen(block, open) {
      var btn = block.querySelector('button.svc-more');
      if (!btn) return;
      block.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.svc-more__text').textContent = open ? 'Show less' : 'Learn More';
    }

    blocks.forEach(function (block) {
      var btn = block.querySelector('button.svc-more');
      if (btn) btn.addEventListener('click', function () {
        setOpen(block, !block.classList.contains('is-open'));
      });
    });

    function openFromHash() {
      var id = decodeURIComponent(window.location.hash.slice(1));
      var block = id && document.getElementById(id);
      if (!block || !block.classList.contains('svc-block') || !block.querySelector('button.svc-more')) return;
      setOpen(block, true);
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);

    var flow = document.querySelector('.svc-flow__row');
    var seen = blocks.concat(flow ? [flow] : []);
    if (reduceMotion || !hasObserver) {
      seen.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.22 });
    seen.forEach(function (el) { io.observe(el); });
  }


  /* ---------- Start ---------- */
  initCardMotion();
  initMeasureRotator();
  initLoadExplorer();
  initFooterMark();
  initSolutionDialog();
  initSolutionScroll();
  initMobileNav();
  initNavIndicator();
  initNavMenus();
  initSymptomFocus();
  initSymptomArt();
  initFaq();
  initIndustryTabs();
  initNavAutoHide();
  initPqScroll();
  initSpotlight();
  initPqHover();
  initPqWave();
  initPqPills();
  initTypewriter();
  initHero();
  initScrollReveal();
  initQuote();
  initYanqWorks();
  initCaseStudies();
  initAboutDecor();
  initContactForm();
  initBrochure();
  initServices();

})();
