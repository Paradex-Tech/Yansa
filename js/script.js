// Yansa website scripts

/* Card motion.
   Ports the framer-motion version to vanilla JS: on hover a card lifts
   slightly, and on the symptom cards it also tilts toward the cursor, up to
   3 degrees. Rotation and scale are eased toward their target each frame so
   the card settles like a spring rather than snapping, and both live in one
   transform string because they share the element's `transform` property.

   The Why Yansa cards only pop. Following the cursor competed with the rule
   that draws in under their heading, so they are left out of the tilt.

   The symptom cards' detail reveal is CSS (:hover / :focus-within), not here. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MAX_TILT = 3;
  var HOVER_SCALE = 1.012;
  var EASE = 0.12;

  var TILTS = '.symptom-card';

  var cards = document.querySelectorAll('.symptom-card, .why-card');

  Array.prototype.forEach.call(cards, function (card) {
    var tilts = card.matches(TILTS);
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

    if (!reduceMotion) {
      card.addEventListener('mouseenter', function () {
        target.scale = HOVER_SCALE;
        run();
      });

      if (tilts) card.addEventListener('mousemove', function (event) {
        var rect = card.getBoundingClientRect();
        var offsetX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        var offsetY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

        target.y = Math.max(-1, Math.min(1, offsetX)) * MAX_TILT;
        target.x = Math.max(-1, Math.min(1, offsetY)) * -MAX_TILT;
        run();
      });

      card.addEventListener('mouseleave', function () {
        target.x = 0;
        target.y = 0;
        target.scale = 1;
        run();
      });
    }
  });

  /* ---------- "We Measure. / We Solve. / We Support." ----------
     Vanilla port of the text-rotate component. The highlighted word is split
     into characters that roll up out of the orange box while the next word's
     characters roll in from below it, each staggered off its neighbour. The
     box and the paragraph ease to their new size rather than snapping.

     The section is "armed" from JS so nothing is hidden when the script never
     runs; the observer then plays the entrance on first scroll-in and hands
     over to the rotation. */
  var measure = document.querySelector('.about-measure');

  if (measure) {
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
    var timer = null;

    function renderWord(word) {
      highlight.textContent = '';

      for (var i = 0; i < word.length; i++) {
        var ch = document.createElement('span');
        ch.className = 'rotate-char';
        ch.textContent = word.charAt(i) === ' ' ? ' ' : word.charAt(i);
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

    /* Swap in a slide: new characters start below the box, both the box width
       and the paragraph height are pinned to their old values, then a single
       forced reflow commits that start state so the new values animate. */
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

      timer = setTimeout(advance, IN_MS + (nodes.length - 1) * STAGGER + HOLD);
    }

    function advance() {
      var nodes = highlight.children;
      var exit = OUT_MS + (nodes.length - 1) * STAGGER;

      setCharState(nodes, 'is-out');
      copy.classList.add('is-swapping');

      timer = setTimeout(function () {
        slide = (slide + 1) % SLIDES.length;
        show(slide);
      }, exit);
    }

    /* Pinned pixel sizes go stale when the column reflows, so hand them back
       to the layout; the next swap re-measures from there. */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        highlight.style.width = '';
        copy.style.height = '';
      }, 150);
    });

    /* The first word is split the moment the section is armed, so the
       highlighter wipe runs across a box that is already the right width and
       the characters roll in behind it rather than replacing visible text. */
    function start() {
      measure.classList.add('is-rotating');
      var nodes = highlight.children;
      setCharState(nodes, 'is-in');
      timer = setTimeout(advance, IN_MS + (nodes.length - 1) * STAGGER + HOLD);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      measure.classList.add('is-armed', 'is-visible');
    } else {
      measure.classList.add('is-armed');
      setCharState(renderWord(SLIDES[slide].word), null);

      var measureObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            measureObserver.unobserve(entry.target);
            measure.classList.add('is-visible');
            setTimeout(start, WIPE_MS);
          });
        },
        { threshold: 0.35 }
      );

      measureObserver.observe(measure);
    }
  }

  /* ---------- "Our Values" — one block per value, driven by scroll ----------
     All three blocks are always on screen. The active one widens into its own
     word; the other two stay narrow teal blocks, pooled to the left if they
     have already had their turn and to the right if they are still waiting,
     with the nearest of each pair the thicker one. Positions are measured out
     from the container's centre line so the word sits dead centre on the page
     however lopsided the blocks are.

     Which value is active comes from the scroll position over the pinned
     section rather than a timer, so the sequence runs once in order at the
     reader's own pace instead of looping back to the start unprompted. */
  var values = document.querySelector('.about-values');

  if (values) {
    var track = values.querySelector('.about-values__bars');
    var blocks = Array.prototype.slice.call(
      values.querySelectorAll('.value-bar')
    );
    var valueCopy = values.querySelector('.about-values__copy');
    var valueLive = values.querySelector('.about-values__live');

    /* Each value's word now lives inside its own sentence, highlighted, rather
       than on a separate rotating line above it. */
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

    var vIndex = -1;    // -1 so the first pass always paints

    /* The bar for the value on screen widens, its immediate neighbour takes a
       middle width and anything further out stays narrow. Width is driven by
       distance from the active one, so the row reads the same scrolling in
       either direction. */
    function layout(active) {
      for (var i = 0; i < blocks.length; i++) {
        var distance = Math.abs(i - active);
        blocks[i].classList.toggle('is-active', distance === 0);
        blocks[i].classList.toggle('is-near', distance === 1);
      }
    }

    /* The copy fades out, is replaced while it cannot be seen, then fades
       back in. Swapping the text outright made it jump from one sentence to
       another with no transition, which read as a glitch next to the bars
       easing alongside it. Matches .about-values__copy's 0.34s opacity. */
    var V_FADE_MS = 300;
    var vSwapTimer = null;

    function vSwapCopy(active) {
      var prevHeight = valueCopy.offsetHeight;
      valueCopy.innerHTML = VALUES[active].copy;
      valueCopy.style.height = 'auto';
      var nextHeight = valueCopy.offsetHeight;
      valueCopy.style.height = prevHeight + 'px';
      void valueCopy.offsetWidth;
      valueCopy.style.height = nextHeight + 'px';
      valueCopy.classList.remove('is-swapping');
    }

    function vShow(active) {
      if (active === vIndex) return;
      var first = vIndex === -1;
      vIndex = active;

      layout(active);
      if (valueLive) valueLive.textContent = VALUES[active].word;

      window.clearTimeout(vSwapTimer);

      // Nothing to fade from on the very first paint.
      if (first) {
        vSwapCopy(active);
        return;
      }

      valueCopy.classList.add('is-swapping');
      vSwapTimer = window.setTimeout(function () {
        vSwapCopy(active);
      }, V_FADE_MS);
    }

    /* Which value the pinned section is showing, from how far through its own
       scroll range the viewport has travelled. The section is taller than the
       viewport by exactly the distance it stays pinned, so that surplus is the
       full range and it divides evenly between the values. */
    function vFromScroll() {
      var range = values.offsetHeight - window.innerHeight;
      if (range <= 0) return 0;

      var travelled = Math.min(Math.max(-values.getBoundingClientRect().top, 0), range);
      var progress = travelled / range;

      return Math.min(VALUES.length - 1, Math.floor(progress * VALUES.length));
    }

    var vFrame = null;
    function vOnScroll() {
      if (vFrame) return;
      vFrame = requestAnimationFrame(function () {
        vFrame = null;
        vShow(vFromScroll());
      });
    }

    /* Seeded without transitions so the blocks are already in position when
       the section first comes into view. */
    function vSeed() {
      track.classList.add('is-static');
      vIndex = -1;
      vShow(vFromScroll());
      void track.offsetWidth;
      track.classList.remove('is-static');
    }

    var vResizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(vResizeTimer);
      vResizeTimer = setTimeout(function () {
        valueCopy.style.height = '';
        vSeed();
      }, 200);
    });

    vSeed();
    window.addEventListener('scroll', vOnScroll, { passive: true });
  }

  /* ---------- "The Problems These Loads Create." — dealt by scroll ----------
     The section is pinned for three screens and scroll position picks which
     card is at the front. Cards already passed lift up and out of the way,
     the rest cascade down-right behind the front one. Each card keeps its
     slot as a class so the movement is one CSS transition rather than a
     per-frame write. */
  var problems = document.querySelector('.problems');

  if (problems) {
    var stack = problems.querySelector('.problems__stack');
    var cards = Array.prototype.slice.call(
      problems.querySelectorAll('.problem-card')
    );
    var dots = Array.prototype.slice.call(problems.querySelectorAll('.dot'));
    var problemsLive = problems.querySelector('.problems__live');

    var SLOTS = ['is-front', 'is-next', 'is-later'];
    var pIndex = -1;

    function dealCards(front) {
      if (front === pIndex) return;
      pIndex = front;

      cards.forEach(function (card, i) {
        var slot = i < front ? 'is-past' : SLOTS[i - front] || 'is-later';
        card.className = 'problem-card ' + slot;
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === front);
      });

      if (problemsLive) {
        var heading = cards[front].querySelector('h3');
        problemsLive.textContent = heading ? heading.textContent : '';
      }
    }

    /* The panel rides in with the page, locks once it is centred, flips the
       three cards in place, then releases. Locking is what stops the cards
       changing while the section is still sliding past.

       The panel's height decides both the lock offset and how long the lock
       lasts, and it depends on how the copy wraps, so it is measured here and
       handed to the stylesheet rather than guessed at. */
    var problemsPanel = problems.querySelector('.problems__sticky');
    var problemsLocked = false;

    function problemsMeasure() {
      // Lock only if the panel actually fits on screen with room to spare;
      // otherwise a pin would trap content off the top of the viewport.
      var h = problemsPanel.offsetHeight;
      var fits = h > 0 && h + 80 <= window.innerHeight;
      var want = fits && !reduceMotion && window.innerWidth > 768;

      if (want) {
        problems.style.setProperty('--problems-panel', h + 'px');
      } else {
        problems.style.removeProperty('--problems-panel');
      }

      problems.classList.toggle('is-locked', want);
      problemsLocked = want;
    }

    function problemFromScroll() {
      var top = problems.getBoundingClientRect().top;
      var p;

      if (problemsLocked) {
        // Progress across the lock: 0 the moment it sticks, 1 as it releases.
        var runway = problems.offsetHeight - problemsPanel.offsetHeight;
        if (runway <= 0) return 0;
        var stuckAt =
          parseFloat(getComputedStyle(problemsPanel).top) || 0;
        p = (stuckAt - top) / runway;
      } else {
        // Unlocked fallback: drive it off the section's travel up the screen.
        var vh = window.innerHeight;
        var from = vh * 0.52;
        var to = vh * -0.1;
        p = (from - top) / (from - to);
      }

      if (p < 0) p = 0;
      if (p > 1) p = 1;

      return Math.min(cards.length - 1, Math.floor(p * cards.length));
    }

    var pFrame = null;
    window.addEventListener(
      'scroll',
      function () {
        if (pFrame) return;
        pFrame = requestAnimationFrame(function () {
          pFrame = null;
          dealCards(problemFromScroll());
        });
      },
      { passive: true }
    );

    problemsMeasure();
    stack.classList.add('is-static');
    pIndex = -1;
    dealCards(problemFromScroll());
    void stack.offsetWidth;
    stack.classList.remove('is-static');

    window.addEventListener('load', function () {
      problemsMeasure();
      pIndex = -1;
      dealCards(problemFromScroll());
    });

    var pResizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(pResizeTimer);
      pResizeTimer = setTimeout(function () {
        problemsMeasure();
        pIndex = -1;
        dealCards(problemFromScroll());
      }, 200);
    });

    /* The card icons draw themselves in as their card reaches the front
       (CSS: .problems.is-inview .is-front .anim-*). Holding the class back
       until the section reaches the middle of the viewport keeps the first
       card's icon from playing unseen below the fold; dropping it again when
       the section leaves lets the animation replay on the way back. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        problems.classList.toggle('is-inview', entries[0].isIntersecting);
      }, { rootMargin: '-30% 0px -30% 0px' }).observe(problems);
    } else {
      problems.classList.add('is-inview');
    }
  }

  /* ---------- Footer mark — concentric waves ----------
     The handoff component (js/concentric-waves-icon.js) is used as shipped,
     apart from the dotColor option added to it so the centre dot can be the
     brand orange against off-white rings.

     The static SVG stays in the markup and is only swapped out once the
     animation is actually mounted, so the mark is still there when the script
     never runs or the reader has asked for reduced motion. */
  var footerIcon = document.querySelector('.footer__icon');

  if (footerIcon && !reduceMotion && typeof window.mountConcentricWaves === 'function') {
    var fallback = footerIcon.querySelector('img');

    window.mountConcentricWaves(footerIcon, {
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

  /* ---------- Solution cards — the card grows into a dialog ----------
     A vanilla port of the morphing-dialog component. The shared-layout
     animation is done by hand: the panel is fixed-positioned, seeded at the
     clicked card's own rect, then its top/left/width/height are transitioned
     to the panel's resting rect. Animating geometry rather than a scale
     transform means the image and the copy inside are never stretched.

     One dialog serves all nine cards; each card carries its own body in a
     hidden block that is cloned in on open. */
  /* Both the product cards and the case study rows morph into the same
     dialog; only the panel's skin differs. */
  var solCards = document.querySelectorAll('.solution-card, .results__item');

  if (solCards.length) {
    var SOL_MOVE = 520;   // matches .sol-dialog__panel's transition
    var SOL_MAX_W = 880;
    var SOL_MARGIN = 24;  // smallest gap kept between panel and viewport edge

    var solDialog = document.createElement('div');
    solDialog.className = 'sol-dialog';
    solDialog.hidden = true;
    solDialog.innerHTML =
      '<div class="sol-dialog__backdrop"></div>' +
      '<div class="sol-dialog__panel" role="dialog" aria-modal="true">' +
        '<button class="sol-dialog__close" type="button" aria-label="Close">&#215;</button>' +
        '<div class="sol-dialog__scroll">' +
          '<div class="sol-dialog__media"></div>' +
          '<div class="sol-dialog__content">' +
            '<h3 class="sol-dialog__title"></h3>' +
            '<div class="sol-dialog__body"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(solDialog);

    var solPanel = solDialog.querySelector('.sol-dialog__panel');
    var solScroll = solDialog.querySelector('.sol-dialog__scroll');
    var solMedia = solDialog.querySelector('.sol-dialog__media');
    var solTitle = solDialog.querySelector('.sol-dialog__title');
    var solBody = solDialog.querySelector('.sol-dialog__body');
    var solClose = solDialog.querySelector('.sol-dialog__close');

    solTitle.id = 'sol-dialog-title';
    solPanel.setAttribute('aria-labelledby', solTitle.id);

    var solSource = null;   // the card currently expanded
    var solTimer = null;

    /* Locking the body removes the scrollbar, which widens the viewport and
       shifts the page sideways. Give the width back as padding so nothing
       under the dialog moves. */
    function solLockScroll() {
      var bar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('--sol-scrollbar', bar + 'px');
      document.body.classList.add('sol-dialog-open');
    }

    function solUnlockScroll() {
      document.body.classList.remove('sol-dialog-open');
      document.body.style.removeProperty('--sol-scrollbar');
    }

    function solFrame(rect) {
      solPanel.style.top = rect.top + 'px';
      solPanel.style.left = rect.left + 'px';
      solPanel.style.width = rect.width + 'px';
      solPanel.style.height = rect.height + 'px';
    }

    /* Where the panel comes to rest: centred, capped, and never taller than
       its own content needs. */
    function solTarget() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var width = Math.min(SOL_MAX_W, vw - SOL_MARGIN * 2);

      // Hold the inner column at the resting width for the whole morph, so
      // the copy is laid out once instead of re-wrapping on every frame.
      solScroll.style.width = width + 'px';

      // Lay the panel out at its final width with height unconstrained, so
      // normal flow reports what the content actually needs.
      solPanel.style.width = width + 'px';
      solPanel.style.height = 'auto';
      var natural = solPanel.offsetHeight;

      var height = Math.min(natural, vh - SOL_MARGIN * 2);

      return {
        width: width,
        height: height,
        left: Math.round((vw - width) / 2),
        top: Math.round((vh - height) / 2)
      };
    }

    function solOpen(card) {
      if (solSource) {
        // Mid-close: finish that hide now so this card can take over, rather
        // than dropping the click for the length of the closing move.
        if (solDialog.classList.contains('is-open')) return;
        window.clearTimeout(solTimer);
        solHide();
      }

      var from = card.getBoundingClientRect();
      var isDoc = card.classList.contains('results__item');
      var name = card.querySelector(
        isDoc ? '.results__title' : '.solution-card__name'
      );
      var detail = card.querySelector(
        isDoc ? '.results__detail' : '.solution-card__detail'
      );
      var photo = card.querySelector('img');

      solPanel.classList.toggle('sol-dialog__panel--doc', isDoc);

      solTitle.textContent = name ? name.textContent : '';
      solBody.innerHTML = detail ? detail.innerHTML : '';

      solMedia.innerHTML = '';
      if (photo) {
        var big = document.createElement('img');
        big.src = photo.src;
        big.alt = '';
        solMedia.appendChild(big);
      }

      solSource = card;
      solLockScroll();
      solDialog.hidden = false;

      // Seed at the card's rect with the transition off, measure the resting
      // rect, then arm the transition and move.
      solDialog.classList.add('is-seeding');
      solFrame(from);
      var to = solTarget();
      solFrame(from);
      void solPanel.offsetWidth;
      solDialog.classList.remove('is-seeding');

      solFrame(to);
      solDialog.classList.add('is-open');

      solClose.focus();
    }

    function solHide() {
      solDialog.hidden = true;
      solDialog.classList.remove('is-open');
      solScroll.style.width = '';
      solUnlockScroll();
      if (solSource) {
        solSource.classList.remove('is-morphing');
        solSource.focus();
        solSource = null;
      }
    }

    function solCloseDialog() {
      if (!solSource) return;
      window.clearTimeout(solTimer);

      // Back to wherever the card is now, which may have moved if the page
      // was resized while the dialog was open.
      solFrame(solSource.getBoundingClientRect());
      solDialog.classList.remove('is-open');

      solTimer = window.setTimeout(solHide, SOL_MOVE);
    }

    Array.prototype.forEach.call(solCards, function (card) {
      card.addEventListener('click', function () {
        solOpen(card);
        card.classList.add('is-morphing');
      });
    });

    solClose.addEventListener('click', solCloseDialog);

    solDialog
      .querySelector('.sol-dialog__backdrop')
      .addEventListener('click', solCloseDialog);

    document.addEventListener('keydown', function (event) {
      if (!solSource) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        solCloseDialog();
        return;
      }

      // Only the close button is focusable inside, so the trap is just
      // keeping Tab on it rather than letting focus escape to the page.
      if (event.key === 'Tab') {
        event.preventDefault();
        solClose.focus();
      }
    });

    /* A resize while open would leave the panel off-centre, and the rect it
       has to return to has moved too. */
    var solResize = null;
    window.addEventListener('resize', function () {
      if (!solSource) return;
      window.clearTimeout(solResize);
      solResize = window.setTimeout(function () {
        if (!solSource) return;
        solDialog.classList.add('is-seeding');
        solFrame(solTarget());
        void solPanel.offsetWidth;
        solDialog.classList.remove('is-seeding');
      }, 120);
    });
  }

  /* ---------- Navbar — out of the way going down, back coming up ----------
     Only the class is toggled here; the slide itself is a CSS transition, so
     the bar never chases the scroll position frame by frame. Small movements
     are ignored so a trackpad's jitter cannot flicker it, and it is always
     shown near the top of the page whichever way the last scroll went. */
  var navbar = document.querySelector('.navbar');

  if (navbar) {
    var NAV_JITTER = 6;   // px of movement to ignore
    var NAV_TOP = 90;     // above this the bar is always shown

    var navLastY = window.pageYOffset;
    var navFrame = null;

    window.addEventListener(
      'scroll',
      function () {
        if (navFrame) return;

        navFrame = requestAnimationFrame(function () {
          navFrame = null;

          var y = window.pageYOffset;
          var delta = y - navLastY;
          if (Math.abs(delta) < NAV_JITTER) return;

          if (y < NAV_TOP || delta < 0) navbar.classList.remove('is-hidden');
          else navbar.classList.add('is-hidden');

          navLastY = y;
        });
      },
      { passive: true }
    );
  }

  /* Symptom cards reveal their detail on hover, which is pure CSS. The only
     thing JS adds is a tab stop, so a keyboard can reach the card and open it
     through :focus-within — there is no control to click. */
  Array.prototype.forEach.call(
    document.querySelectorAll('.symptom-card'),
    function (card) {
      card.setAttribute('tabindex', '0');
    }
  );

  /* FAQ accordion — only one answer open at a time.
     Opening an item closes whichever one was open before it. */
  /* ---------- FAQ ----------
     A <details> has no in-between state: the browser either renders its
     content or it does not, so the answer would appear and vanish outright.
     The script takes ownership of `open` instead - it is set before the
     opening animation and cleared only once the closing one has finished -
     and animates the answer's height, its gap and its opacity in between.

     The first answer is opened the same way when the list first scrolls into
     view rather than at page load, because the section sits well below the
     fold and an animation nobody is there for may as well not have run. The
     markup keeps `open` on that item, so with no JS it is already open and
     every answer still works the way the browser intends. */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq__item'));

  if (faqItems.length) {
    var FAQ_MS = 420;   // keep in step with the transition in style.css

    // Read the answer's resting gap from the stylesheet before anything is
    // written inline, since after that this would read back our own value.
    var faqFirstAnswer = faqItems[0].querySelector('.faq__answer');
    var FAQ_GAP = faqFirstAnswer
      ? parseFloat(window.getComputedStyle(faqFirstAnswer).marginTop) || 0
      : 0;

    faqItems.forEach(function (item) {
      item.faqTimer = null;
    });

    function faqSettle(item, answer) {
      window.clearTimeout(item.faqTimer);
      item.faqTimer = null;
      return answer;
    }

    function faqOpen(item) {
      var a = item.querySelector('.faq__answer');
      if (!a) { item.open = true; return; }
      faqSettle(item, a);

      item.open = true;              // the content has to exist to be measured
      item.classList.add('is-animated');

      a.style.height = '0px';
      a.style.marginTop = '0px';
      a.style.opacity = '0';
      void a.offsetHeight;           // flush, so the change below animates

      a.style.height = a.scrollHeight + 'px';
      a.style.marginTop = FAQ_GAP + 'px';
      a.style.opacity = '1';

      // Back to auto once it has arrived, so a resize or a font swap can
      // still reflow the answer instead of being held at a stale height.
      item.faqTimer = window.setTimeout(function () {
        a.style.height = 'auto';
        item.faqTimer = null;
      }, FAQ_MS);
    }

    function faqClose(item) {
      var a = item.querySelector('.faq__answer');
      if (!a) { item.open = false; return; }
      faqSettle(item, a);

      item.classList.add('is-animated');

      // From a measured height rather than from `auto`, which cannot animate.
      a.style.height = a.getBoundingClientRect().height + 'px';
      void a.offsetHeight;

      a.style.height = '0px';
      a.style.marginTop = '0px';
      a.style.opacity = '0';

      item.faqTimer = window.setTimeout(function () {
        item.open = false;         // only now is the content safe to drop
        item.faqTimer = null;
      }, FAQ_MS);
    }

    faqItems.forEach(function (item) {
      var summary = item.querySelector('summary');
      if (!summary) return;

      summary.addEventListener('click', function (event) {
        // The script decides when `open` changes, not the click.
        event.preventDefault();

        if (item.open && item.faqTimer === null) {
          faqClose(item);
          return;
        }

        faqItems.forEach(function (other) {
          if (other !== item && other.open) faqClose(other);
        });
        faqOpen(item);
      });
    });

    if (reduceMotion) {
      // Leave the markup's open item as it is and skip the animation.
      faqItems.forEach(function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) return;
          faqItems.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        });
      });
    } else {
      /* Shut whatever the markup opened, before the first paint, so the
         answer is not seen open and then closed. */
      var faqFirst = faqItems.filter(function (i) { return i.open; })[0] || faqItems[0];
      faqItems.forEach(function (item) { item.open = false; });

      var faqList = document.querySelector('.faq__list');

      function faqIntro() {
        // A beat after the section's own entrance, so the two read in order.
        window.setTimeout(function () { faqOpen(faqFirst); }, 520);
      }

      if (faqList && 'IntersectionObserver' in window) {
        var faqObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              faqObserver.unobserve(entry.target);
              faqIntro();
            });
          },
          { threshold: 0.25 }
        );
        faqObserver.observe(faqList);
      } else {
        faqIntro();
      }
    }
  }


  /* Typewriter — about page statement.
     Vanilla port of the motion/react reference: characters reveal one at a
     time and a caret leads them, sitting at the edge of the text it is
     typing.

     Every character is wrapped in its own span and present from the start at
     opacity 0, so the paragraph occupies its final size immediately. Nothing
     reflows while typing, which means all caret stops can be measured once up
     front and the animation loop only ever writes a transform. Each character
     fades rather than pops, and the caret's own transition is no longer than
     the interval between characters, so it reads as a continuous glide instead
     of a series of hops while still reaching each stop before the next
     character shows. */
  var twPara = document.querySelector('.about-statement p');

  if (twPara) {
    // ms between characters; .tw-caret's transform transition in style.css
    // must not exceed this, or the caret falls behind the typed text.
    var TW_STEP = 30;
    var twChars = [];
    var twStops = [];
    var twRevealed = 0;
    var twLastY = null;
    var twStart = null;

    var twFullText = twPara.textContent.replace(/\s+/g, ' ').trim();

    /* Split every text node into per-character spans, recursing through the
       inline colour spans (.accent / .teal-text) so their styling survives. */
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var text = child.nodeValue;
          var frag = document.createDocumentFragment();
          for (var i = 0; i < text.length; i++) {
            var span = document.createElement('span');
            span.className = 'tw-char';
            span.textContent = text.charAt(i);
            frag.appendChild(span);
            twChars.push(span);
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          split(child);
        }
      });
    })(twPara);

    /* Keep the sentence readable as one string for assistive tech, and hide
       the shredded version from it. */
    var twSr = document.createElement('span');
    twSr.className = 'sr-only';
    twSr.textContent = twFullText;
    twPara.insertBefore(twSr, twPara.firstChild);

    var twVisual = document.createElement('span');
    twVisual.setAttribute('aria-hidden', 'true');
    // move every char span into the aria-hidden wrapper, preserving structure
    Array.prototype.slice.call(twPara.childNodes).forEach(function (node) {
      if (node !== twSr) twVisual.appendChild(node);
    });
    twPara.appendChild(twVisual);

    var twCaret = document.createElement('span');
    twCaret.className = 'tw-caret';
    twCaret.setAttribute('aria-hidden', 'true');
    twPara.appendChild(twCaret);

    twPara.classList.add('tw');

    function twMeasure() {
      var base = twPara.getBoundingClientRect();
      twStops = twChars.map(function (c) {
        var r = c.getBoundingClientRect();
        return {
          left: r.left - base.left,
          right: r.right - base.left,
          top: r.top - base.top,
          height: r.height
        };
      });
      if (twStops.length) twCaret.style.height = twStops[0].height + 'px';
    }

    function twMoveCaret(index) {
      if (!twStops.length) return;
      var stop = twStops[index < 0 ? 0 : index];
      var x = index < 0 ? stop.left : stop.right;
      var y = stop.top;

      // A line wrap should not send the caret sliding across the paragraph.
      if (twLastY !== null && Math.abs(y - twLastY) > 2) {
        twCaret.classList.add('is-jump');
        twCaret.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        void twCaret.offsetWidth; // flush so the next move animates again
        twCaret.classList.remove('is-jump');
      } else {
        twCaret.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      }
      twLastY = y;
    }

    function twFrame(now) {
      if (twStart === null) twStart = now;
      var target = Math.min(
        twChars.length,
        Math.floor((now - twStart) / TW_STEP) + 1
      );
      while (twRevealed < target) {
        twChars[twRevealed].classList.add('is-in');
        twRevealed++;
      }
      twMoveCaret(twRevealed - 1);
      if (twRevealed < twChars.length) requestAnimationFrame(twFrame);
    }

    function twRevealAll() {
      twChars.forEach(function (c) {
        c.classList.add('is-in');
      });
      twRevealed = twChars.length;
    }

    if (reduceMotion) {
      twRevealAll();
      twCaret.parentNode.removeChild(twCaret);
    } else {
      twMeasure();
      twMoveCaret(-1);

      var twObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            twObserver.unobserve(entry.target);
            requestAnimationFrame(twFrame);
          });
        },
        { threshold: 0.35 }
      );
      twObserver.observe(twPara);

      var twResizeTimer = null;
      window.addEventListener('resize', function () {
        window.clearTimeout(twResizeTimer);
        twResizeTimer = window.setTimeout(function () {
          twMeasure();
          twLastY = null;
          twMoveCaret(twRevealed - 1);
        }, 120);
      });
    }
  }


  /* Home hero — scroll-driven video reveal.

     The CSS already describes the settled hero on its own, so this only opts
     into the animation: it adds .is-scrolly, which pins the stage and lifts
     the media out of its frame, then drives it from full bleed back into the
     frame as the page scrolls. If this never runs, or the viewport is narrow,
     or the visitor prefers reduced motion, the plain layout stands.

     The stage is pinned with position:sticky, so the page's own scroll bar
     drives the animation and the wheel is never hijacked. The end state is
     measured from the layout (.hero__frame-slot) rather than hard-coded, so
     progress 1 lands exactly on the designed hero. And scroll position is
     followed with a damped lerp rather than applied raw, so a coarse wheel
     notch glides to its new value instead of snapping. */
  var hero = document.querySelector('.hero');

  if (hero && hero.querySelector('.hero__frame-slot')) {
    var heroStage = hero.querySelector('.hero__stage');
    var heroHeading = hero.querySelector('.hero__heading');
    var heroH1 = heroHeading.querySelector('h1');
    var heroSub = heroHeading.querySelector('p');
    var heroSlot = hero.querySelector('.hero__frame-slot');
    var heroMedia = hero.querySelector('.hero__media');
    var heroScrim = hero.querySelector('.hero__media-scrim');
    var heroCtas = hero.querySelector('.hero__ctas');

    var HERO_HEAD_SCALE = 1.55; // heading size at full bleed, relative to final
    var HERO_RADIUS = 10;
    var HERO_BORDER = 10;
    var HERO_DAMP = 0.16;

    var heroGeo = null;
    var heroTarget = 0;
    var heroCurrent = 0;
    var heroRaf = null;
    var heroOn = false;

    function heroClamp(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function heroLerp(a, b, t) {
      return a + (b - a) * t;
    }

    /* Slow in, slow out — the motion should never arrive at a hard stop. */
    function heroEase(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function heroMix(from, to, t) {
      return (
        'rgb(' +
        Math.round(heroLerp(from[0], to[0], t)) + ',' +
        Math.round(heroLerp(from[1], to[1], t)) + ',' +
        Math.round(heroLerp(from[2], to[2], t)) + ')'
      );
    }

    function heroMeasure() {
      /* Measure the heading untransformed. Without this the next measurement
         would read back the offset the last one applied and collapse to zero. */
      var prevTransform = heroHeading.style.transform;
      heroHeading.style.transform = 'none';

      var stageRect = heroStage.getBoundingClientRect();
      var slotRect = heroSlot.getBoundingClientRect();
      var headRect = heroHeading.getBoundingClientRect();

      heroHeading.style.transform = prevTransform;

      heroGeo = {
        stageW: stageRect.width,
        stageH: stageRect.height,
        boxLeft: slotRect.left - stageRect.left,
        boxTop: slotRect.top - stageRect.top,
        boxW: slotRect.width,
        boxH: slotRect.height,
        // how far the heading must rise to sit centred in the stage
        headShift:
          stageRect.height / 2 -
          (headRect.top - stageRect.top + headRect.height / 2)
      };
    }

    function heroApply(p) {
      if (!heroGeo) return;
      var e = heroEase(p);

      heroMedia.style.left = heroLerp(0, heroGeo.boxLeft, e) + 'px';
      heroMedia.style.top = heroLerp(0, heroGeo.boxTop, e) + 'px';
      heroMedia.style.width = heroLerp(heroGeo.stageW, heroGeo.boxW, e) + 'px';
      heroMedia.style.height = heroLerp(heroGeo.stageH, heroGeo.boxH, e) + 'px';
      heroMedia.style.borderRadius = heroLerp(0, HERO_RADIUS, e) + 'px';
      heroMedia.style.borderWidth = heroLerp(0, HERO_BORDER, e) + 'px';
      heroMedia.style.boxShadow =
        '0 0 0 1px rgba(0, 0, 0, ' + (0.2 * e).toFixed(3) + '), ' +
        '0 2px 8px rgba(0, 0, 0, ' + (0.12 * e).toFixed(3) + ')';

      heroHeading.style.transform =
        'translate3d(0, ' + heroLerp(heroGeo.headShift, 0, e).toFixed(2) + 'px, 0) ' +
        'scale(' + heroLerp(HERO_HEAD_SCALE, 1, e).toFixed(4) + ')';

      heroH1.style.color = heroMix([255, 255, 255], [0, 127, 127], e);
      heroSub.style.color = heroMix([255, 255, 255], [21, 21, 21], e);

      heroScrim.style.opacity = 1 - heroClamp(e / 0.75);

      // The buttons belong to the settled state, so they arrive late.
      var c = heroClamp((e - 0.45) / 0.55);
      heroCtas.style.opacity = c;
      heroCtas.style.transform =
        'translate3d(0, ' + ((1 - c) * 20).toFixed(2) + 'px, 0)';
    }

    /* Hand every property back to the stylesheet. */
    function heroReset() {
      [
        heroMedia.style,
        heroHeading.style,
        heroH1.style,
        heroSub.style,
        heroScrim.style,
        heroCtas.style
      ].forEach(function (style) {
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

    function heroProgress() {
      var runway = hero.offsetHeight - heroGeo.stageH;
      if (runway <= 0) return 1;
      var stuckAt = parseFloat(getComputedStyle(heroStage).top) || 0;
      return heroClamp((stuckAt - hero.getBoundingClientRect().top) / runway);
    }

    function heroTick() {
      var diff = heroTarget - heroCurrent;
      if (Math.abs(diff) < 0.0004) {
        heroCurrent = heroTarget;
        heroApply(heroCurrent);
        heroRaf = null;
        return;
      }
      heroCurrent += diff * HERO_DAMP;
      heroApply(heroCurrent);
      heroRaf = requestAnimationFrame(heroTick);
    }

    function heroOnScroll() {
      if (!heroOn) return;
      heroTarget = heroProgress();
      if (heroRaf === null) heroRaf = requestAnimationFrame(heroTick);
    }

    function heroShouldRun() {
      return !reduceMotion && window.innerWidth > 768;
    }

    function heroSync() {
      var want = heroShouldRun();

      if (!want) {
        if (heroOn || hero.classList.contains('is-scrolly')) {
          hero.classList.remove('is-scrolly');
          heroReset();
        }
        heroOn = false;
        return;
      }

      hero.classList.add('is-scrolly');
      heroOn = true;
      heroMeasure();
      heroTarget = heroProgress();
      heroCurrent = heroTarget;
      heroApply(heroCurrent);
    }

    heroSync();

    window.addEventListener('scroll', heroOnScroll, { passive: true });

    var heroResizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(heroResizeTimer);
      heroResizeTimer = window.setTimeout(heroSync, 120);
    });

    // The frame's height depends on the media box, so re-measure once
    // images and fonts have settled.
    window.addEventListener('load', heroSync);
  }

  /* ---------- Our Values — entrance for the pinned panel ----------
     The panel is sticky, so by the time the previous section clears the
     screen its contents are simply already there. Arming it while that
     section still fills the viewport lets the bars and heading rise into
     their fixed position and settle before the reader arrives at them.

     A 0.35 threshold on a full-height sticky means roughly a third of the
     panel has scrolled up past the bottom edge, which is still short of the
     heading's resting place - so the slide plays as the panel travels and
     lands just as the heading reaches the middle of the screen.

     Both classes come off once the entrance has played. They outrank
     .about-values__copy's own swap transition, so leaving them on would
     make every later value change use the entrance timing instead. */
  var valuesPanel = document.querySelector('.about-values');
  var valuesStick = valuesPanel && valuesPanel.querySelector('.about-values__sticky');

  if (valuesStick && !reduceMotion && 'IntersectionObserver' in window) {
    valuesPanel.classList.add('is-armed');

    var valuesEntry = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          valuesEntry.unobserve(entry.target);
          valuesPanel.classList.add('is-visible');
          window.setTimeout(function () {
            valuesPanel.classList.remove('is-armed');
            valuesPanel.classList.remove('is-visible');
          }, 1200);
        });
      },
      { threshold: 0.35 }
    );

    valuesEntry.observe(valuesStick);
  }


  /* ---------- Scroll reveal - the same entrance everywhere else ----------
     Every other section arrived fully formed, which read as rigid. This
     gives each one a short settling motion the first time it is scrolled
     to: the element starts a little low and transparent and eases up into
     place, with siblings in a row or a grid following one another.

     Targets are picked by selector from here rather than marked up in the
     HTML, so the pages stay untouched and a selector that matches nothing
     on the current page simply does nothing.

     Each element is handed back to its own stylesheet the moment it has
     arrived: the attribute and classes come off again, which matters
     because the reveal's `transform: none` is more specific than the hover
     transforms and would otherwise sit on top of them for the rest of the
     visit.

     `step` is the stagger between siblings in a set. `mode: "fade"` is for
     anything whose transform belongs to another script, or whose layout
     leans on overlap, where sliding it would fight or break the stack.

     The sections that already run their own scroll animation - the home
     hero, We Measure, the typewriter statement, the dealt problem cards and
     the pinned values panel above - are deliberately absent. */
  var REVEAL_SETS = [
    /* page furniture, on every page */
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

    /* footer, on every page */
    { sel: '.footer__cta > *', step: 90, mode: 'fade' },
    { sel: '.footer__bottom > *', step: 110 }
  ];

  var REVEAL_MS = 700; // keep in step with --reveal-dur in the stylesheet

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealSeen = [];

    /* Hand an element back to its own stylesheet. Driven off transitionend,
       with a timer behind it because transitionend never fires for an
       element whose transition was never actually run - a tab hidden for the
       whole of it, or a value that did not change. */
    function revealDone(el) {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-revealed');
      el.style.removeProperty('--reveal-delay');
      el.style.removeProperty('will-change');
    }

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          revealObserver.unobserve(el);
          el.classList.add('is-revealed');

          var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
          var timer = window.setTimeout(function () {
            revealDone(el);
          }, REVEAL_MS + delay + 160);

          el.addEventListener(
            'transitionend',
            function (event) {
              if (event.propertyName !== 'opacity') return;
              window.clearTimeout(timer);
              revealDone(el);
            },
            { once: true }
          );
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    REVEAL_SETS.forEach(function (set) {
      var items = Array.prototype.slice.call(document.querySelectorAll(set.sel));

      items.forEach(function (el, i) {
        // A screen-reader-only live region has no box worth animating.
        if (el.classList.contains('sr-only')) return;
        if (revealSeen.indexOf(el) !== -1) return;
        revealSeen.push(el);

        el.setAttribute('data-reveal', set.mode === 'fade' ? 'fade' : 'slide');
        if (set.step) el.style.setProperty('--reveal-delay', i * set.step + 'ms');
        revealObserver.observe(el);
      });
    });

    /* Added last and only if there is something to hide, so a page the list
       does not touch is never left waiting on an observer. */
    if (revealSeen.length) document.documentElement.classList.add('js-reveal');
  }


  /* Quote — scroll-driven read-along.

     Nothing is pinned. Progress is where the paragraph has got to on its way
     up the viewport, so the reveal plays as the block travels the screen and
     the page never stops under the reader. As progress runs 0 -> 1 the rail
     on the left fills and the sentence warms from muted teal to white.

     The warming advances a word at a time: a word is either muted or lit,
     never part way between, so the line brightens in discrete steps instead
     of a gradient sweeping across it.

     The stylesheet already describes the finished state (rail full, all words
     white), so if this never runs the quote is just a normal block of type. */
  var quote = document.querySelector('.quote');

  if (quote && quote.querySelector('.quote__stage')) {
    var qPara = quote.querySelector('p');

    var Q_DAMP = 0.16;
    var Q_LEAD = 1;        // a word of extra travel, so the last one lights
                           // without progress having to land on exactly 1

    var qWords = [];
    var qTarget = 0;
    var qCurrent = 0;
    var qRaf = null;
    var qOn = false;

    /* One span per word, with the spaces left as plain text between them so
       the line still wraps exactly where it would have. */
    (function splitWords() {
      var parts = qPara.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();

      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '') continue;
        if (/^\s+$/.test(parts[i])) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          var span = document.createElement('span');
          span.className = 'quote__word';
          span.textContent = parts[i];
          frag.appendChild(span);
          qWords.push(span);
        }
      }

      qPara.innerHTML = '';
      qPara.appendChild(frag);
    })();

    function qClamp(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function qApply(p) {
      qPara.style.setProperty('--quote-rail', p.toFixed(4));

      // A word lights once the edge has passed it completely, so none is ever
      // caught part-coloured. Both colours live in the stylesheet now; this
      // only says which words have been reached.
      var edge = p * (qWords.length + Q_LEAD);

      for (var i = 0; i < qWords.length; i++) {
        qWords[i].classList.toggle('is-lit', edge >= i + 1);
      }
    }

    function qReset() {
      qPara.style.removeProperty('--quote-rail');
      for (var i = 0; i < qWords.length; i++) qWords[i].classList.remove('is-lit');
    }

    /* Progress is read off the paragraph's own position in the viewport.
       It starts once the block has risen past Q_START and is finished by the
       time it reaches Q_END, which is high enough up the screen that the
       whole sentence is lit while still sitting in comfortable reading
       position, and low enough that it is not finished long before it
       leaves. */
    var Q_START = 0.75; // fraction of viewport height: reveal begins here
    var Q_END = 0.28;   // and is complete here

    function qProgress() {
      var top = qPara.getBoundingClientRect().top;
      var from = window.innerHeight * Q_START;
      var to = window.innerHeight * Q_END;
      if (from <= to) return 1;
      return qClamp((from - top) / (from - to));
    }

    function qTick() {
      var diff = qTarget - qCurrent;
      if (Math.abs(diff) < 0.0004) {
        qCurrent = qTarget;
        qApply(qCurrent);
        qRaf = null;
        return;
      }
      qCurrent += diff * Q_DAMP;
      qApply(qCurrent);
      qRaf = requestAnimationFrame(qTick);
    }

    function qOnScroll() {
      if (!qOn) return;
      qTarget = qProgress();
      if (qRaf === null) qRaf = requestAnimationFrame(qTick);
    }

    function qShouldRun() {
      return !reduceMotion && window.innerWidth > 768;
    }

    function qSync() {
      if (!qShouldRun()) {
        if (qOn || quote.classList.contains('is-scrolly')) {
          quote.classList.remove('is-scrolly');
          qReset();
        }
        qOn = false;
        return;
      }

      quote.classList.add('is-scrolly');
      qOn = true;
      qTarget = qProgress();
      qCurrent = qTarget;
      qApply(qCurrent);
    }

    qSync();

    window.addEventListener('scroll', qOnScroll, { passive: true });

    var qResizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(qResizeTimer);
      qResizeTimer = window.setTimeout(qSync, 120);
    });

    window.addEventListener('load', qSync);
  }


  /* Case studies — pinned, and scroll steps through the cards.

     One card is open at a time. The ones already read collapse to a header
     strip above it and the ones still to come have not arrived yet, so by the
     end the stack looks the way it is drawn in the design, but every card has
     had its turn open on the way there.

     An earlier version simply faded all three into that final stacked
     arrangement, which left cards 01 and 02 permanently buried under 03 with
     no way to read them. Stepping is what makes the content reachable.

     Which card is open comes from scroll position, and the movement between
     steps is a CSS transition, matching how the problems stack and the values
     panel are driven. The stylesheet describes the finished stack, so with no
     JS this section is just a normal block. */
  var cases = document.querySelector('.cases');

  if (cases && cases.querySelector('.cases__stage')) {
    var cStage = cases.querySelector('.cases__stage');
    var cStack = cases.querySelector('.cases__stack');
    var cCards = Array.prototype.slice.call(
      cases.querySelectorAll('.case-card')
    );
    var cDots = Array.prototype.slice.call(
      cases.querySelectorAll('.cases__dots .dot')
    );
    var cIndex = -1; // -1 so the first pass always paints
    var cOn = false;

    function cReadVar(name, fallback) {
      var raw = getComputedStyle(document.documentElement).getPropertyValue(name);
      var n = parseFloat(raw);
      return isNaN(n) ? fallback : n;
    }

    function cShow(active) {
      if (active === cIndex) return;
      cIndex = active;

      for (var i = 0; i < cCards.length; i++) {
        cCards[i].classList.toggle('is-active', i === active);
        cCards[i].classList.toggle('is-past', i < active);
      }

      for (var d = 0; d < cDots.length; d++) {
        cDots[d].classList.toggle('is-active', d === active);
      }
    }

    function cReset() {
      cIndex = -1;
      for (var i = 0; i < cCards.length; i++) {
        cCards[i].classList.remove('is-active', 'is-past');
      }
      for (var d = 0; d < cDots.length; d++) {
        cDots[d].classList.remove('is-active');
      }
    }

    /* Which card the pinned section is showing, from how far through its own
       scroll range the viewport has travelled. The surplus height over the
       stage is the full range, and it divides evenly between the cards. */
    function cFromScroll() {
      var range = cases.offsetHeight - cStage.getBoundingClientRect().height;
      if (range <= 0) return cCards.length - 1;

      var stuckAt = parseFloat(getComputedStyle(cStage).top) || 0;
      var travelled = Math.min(
        Math.max(stuckAt - cases.getBoundingClientRect().top, 0),
        range
      );

      return Math.min(
        cCards.length - 1,
        Math.floor((travelled / range) * cCards.length)
      );
    }

    var cFrame = null;
    function cOnScroll() {
      if (!cOn || cFrame) return;
      cFrame = requestAnimationFrame(function () {
        cFrame = null;
        cShow(cFromScroll());
      });
    }

    /* The pinned stage is one viewport tall, and at its tallest the stack is
       the open card plus a strip for each of the others. If that will not fit
       under the header, the open card would run off screen with no way to
       scroll to it, so the section is left alone instead. */
    function cFits() {
      var strip = cReadVar('--case-strip', 112);
      var full = cReadVar('--case-full', 400);
      var navH = cReadVar('--nav-height', 0);

      // The tallest step is the open card plus a strip for every other one.
      var tallest = full + strip * (cCards.length - 1);

      // Measure the surrounding chrome rather than assuming it: the stage's
      // own top padding and the header's height and gap all eat into the
      // viewport the stack has to live in.
      var header = cases.querySelector('.cases__header');
      var headerStyle = getComputedStyle(header);
      var stagePadTop = parseFloat(getComputedStyle(cStage).paddingTop) || 0;
      var headerH =
        header.getBoundingClientRect().height +
        (parseFloat(headerStyle.marginBottom) || 0);

      var needed = stagePadTop + headerH + tallest + 24;

      return needed <= window.innerHeight - navH;
    }

    function cShouldRun() {
      return !reduceMotion && window.innerWidth > 768 && cFits();
    }

    function cSync() {
      if (!cShouldRun()) {
        if (cOn || cases.classList.contains('is-scrolly')) {
          cases.classList.remove('is-scrolly');
          cReset();
        }
        cOn = false;
        return;
      }

      cases.classList.add('is-scrolly');
      cOn = true;

      // Seeded without transitions so the stack is already in position the
      // first time the section comes into view.
      cStack.classList.add('is-static');
      cIndex = -1;
      cShow(cFromScroll());
      void cStack.offsetWidth;
      cStack.classList.remove('is-static');
    }

    cSync();

    window.addEventListener('scroll', cOnScroll, { passive: true });

    var cResizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(cResizeTimer);
      cResizeTimer = window.setTimeout(cSync, 120);
    });

    window.addEventListener('load', cSync);
  }

  /* ---------- About hero - floating decor ----------
     The four rectangles behind the hero drift as though they were suspended
     in something thick: slowly, never in step with one another, and barely
     far enough to notice until you watch one.

     Three things move a card, and they are summed into a single transform so
     they never fight over the property:

       drift    - two sine waves per axis on long, deliberately mismatched
                  periods, plus a slower one for rotation. Because the periods
                  do not divide into one another the four never fall into the
                  same rhythm and the loop is not visible.
       push     - displacement away from the cursor, strongest when it is
                  closest and falling off to nothing at PUSH_RADIUS. Eased at
                  a low rate so a card leans away and coasts back rather than
                  tracking the pointer - that lag is what reads as viscosity.
       parallax - an extra lift as the hero scrolls, so the cards travel up
                  faster than the page. Eased out rather than left linear:
                  spread evenly the first hundred pixels of scroll barely
                  showed, and simply steepening the line instead would have
                  thrown the cards clear of the hero by the end of it.

     A card's size stands in for its mass: the small one drifts and shoves
     furthest, the big one is the most reluctant, while parallax runs the
     other way so the big one reads as nearest to the viewer.

     The loop only runs while the hero is on screen, and not at all under
     reduced motion or below 900px, where the stylesheet hides the cards. */
  var decorHero = document.querySelector('.about-hero');
  var decorCards = decorHero
    ? Array.prototype.slice.call(decorHero.querySelectorAll('.about-hero__decor'))
    : [];

  if (decorCards.length && !reduceMotion && window.matchMedia('(min-width: 901px)').matches) {
    var PUSH_RADIUS = 340;   // px; beyond this the cursor is not felt at all
    var PUSH_MAX = 9;        // px of displacement at the very centre
    var PUSH_EASE = 0.035;   // low, so cards lag the pointer through the "oil"
    var DRIFT_X = 9;         // px, before the per-card size factor
    var DRIFT_Y = 11;
    var DRIFT_ROT = 1.2;     // degrees
    var LIFT = 118;          // px of parallax across the whole hero, before
                             // the per-card size factor

    var decor = decorCards.map(function (el, i) {
      var r = el.getBoundingClientRect();
      // Bigger card, smaller factor: it takes more to move.
      var factor = Math.min(1.6, Math.max(0.55, 160 / Math.sqrt(r.width * r.height || 1)));
      return {
        el: el,
        factor: factor,
        lift: LIFT / factor,    // parallax runs opposite to drift
        // Mismatched periods and offsets, so no two cards share a rhythm.
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

    // The hero's resting distance from the top of the document. Parallax is
    // counted from here rather than from -rect.top, which only leaves zero
    // once the hero's top has passed the top of the viewport - the hero sits
    // below the navbar, so that wasted the opening stretch of the scroll.
    var decorTop = decorHero.getBoundingClientRect().top + window.pageYOffset;

    var decorRaf = null;
    var decorLive = false;
    var decorPointer = null;   // null until the cursor is actually over the hero

    function decorFrame(now) {
      var rect = decorHero.getBoundingClientRect();
      var scrolled = Math.max(0, decorTop - rect.top);

      // Most of the travel is spent early, so the movement is obvious as
      // soon as the page starts moving and has settled by the time the hero
      // is leaving.
      var through = Math.min(1, scrolled / (rect.height || 1));
      var eased = 1 - (1 - through) * (1 - through);

      for (var i = 0; i < decor.length; i++) {
        var d = decor[i];

        var drift = d.factor;
        var x =
          Math.sin(now / d.px1 + d.phase) * DRIFT_X * drift +
          Math.sin(now / d.px2 + d.phase * 1.6) * DRIFT_X * 0.55 * drift;
        var y =
          Math.cos(now / d.py1 + d.phase) * DRIFT_Y * drift +
          Math.sin(now / d.py2 + d.phase * 2.1) * DRIFT_Y * 0.45 * drift;
        var rot = Math.sin(now / d.pr + d.phase) * DRIFT_ROT * drift;

        // Ease the cursor push toward its target rather than snapping to it.
        d.pushX += (d.toX - d.pushX) * PUSH_EASE;
        d.pushY += (d.toY - d.pushY) * PUSH_EASE;

        d.el.style.transform =
          'translate3d(' +
          (x + d.pushX).toFixed(2) + 'px,' +
          (y + d.pushY - d.lift * eased).toFixed(2) + 'px,0)' +
          ' rotate(' + rot.toFixed(3) + 'deg)';
      }

      decorRaf = decorLive ? requestAnimationFrame(decorFrame) : null;
    }

    /* Where each card wants to sit given the pointer. Recomputed on move
       rather than every frame, since it only changes when the cursor does. */
    function decorAim() {
      for (var i = 0; i < decor.length; i++) {
        var d = decor[i];

        if (!decorPointer) {
          d.toX = 0;
          d.toY = 0;
          continue;
        }

        var r = d.el.getBoundingClientRect();
        var dx = r.left + r.width / 2 - decorPointer.x;
        var dy = r.top + r.height / 2 - decorPointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist >= PUSH_RADIUS) {
          d.toX = 0;
          d.toY = 0;
          continue;
        }

        // Cubed falloff: at half the radius the cursor is only felt at an
        // eighth of its strength, so a card is nudged rather than shoved.
        var strength = Math.pow(1 - dist / PUSH_RADIUS, 3) * PUSH_MAX * d.factor;
        d.toX = (dx / dist) * strength;
        d.toY = (dy / dist) * strength;
      }
    }

    function decorStart() {
      if (decorLive) return;
      decorLive = true;
      if (decorRaf === null) decorRaf = requestAnimationFrame(decorFrame);
    }

    function decorStop() {
      decorLive = false;
    }

    decorHero.addEventListener('mousemove', function (event) {
      decorPointer = { x: event.clientX, y: event.clientY };
      decorAim();
    });

    decorHero.addEventListener('mouseleave', function () {
      decorPointer = null;
      decorAim();
    });

    // Parallax has to keep up with the page, not just with the pointer.
    window.addEventListener('scroll', function () {
      if (decorLive && decorRaf === null) decorRaf = requestAnimationFrame(decorFrame);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) decorStart();
          else decorStop();
        });
      }).observe(decorHero);
    } else {
      decorStart();
    }

    /* Below 900px the cards are display:none, so stop writing transforms
       onto them; above it, pick the loop back up. */
    var decorResize = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(decorResize);
      decorResize = window.setTimeout(function () {
        decorTop = decorHero.getBoundingClientRect().top + window.pageYOffset;
        if (window.matchMedia('(min-width: 901px)').matches) decorStart();
        else decorStop();
        decorAim();
      }, 150);
    });
  }

  /* ---------- Forms → Google Sheet ----------
     Both forms post to a Google Apps Script web app (backend/forms.gs), which
     appends a row to the "Yansa Website — Form Submissions" sheet. The body
     is form-encoded so the browser sends it without a CORS preflight, which
     Apps Script can't answer. */
  var FORMS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby1FseYxoZf98idb1vlxApBTynyOCM12i5B3SKHmHeEEYV1xkUWQpcnin7PoLonbN95UA/exec'; // Apps Script "Web app" URL, ends in /exec

  // Brochure PDF to download after the form. Empty = thank-you only.
  var BROCHURE_URL = 'assets/yansa-brochure.pdf';

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

  // Honeypot for bots; hidden from people and screen readers
  var HONEYPOT =
    '<input type="text" name="website" class="form-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';

  /* ---------- Contact form ---------- */
  var contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.insertAdjacentHTML('beforeend', HONEYPOT);
    var cButton = contactForm.querySelector('button[type="submit"]');
    var cStatus = document.createElement('p');
    cStatus.className = 'form-status';
    cStatus.setAttribute('role', 'status');
    contactForm.appendChild(cStatus);

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      cButton.disabled = true;
      cButton.textContent = 'Sending…';
      cStatus.textContent = '';
      cStatus.classList.remove('form-status--error');

      sendForm('contact', contactForm)
        .then(function () {
          contactForm.reset();
          cStatus.textContent = 'Thank you! We’ll be in touch shortly.';
        })
        .catch(function () {
          cStatus.textContent = 'Something went wrong. Please try again, or email us directly.';
          cStatus.classList.add('form-status--error');
        })
        .then(function () {
          cButton.disabled = false;
          cButton.textContent = 'Send';
        });
    });
  }

  /* ---------- Brochure — details before download ----------
     Every "Download Brochure" button (a[data-brochure]) opens a small form.
     The details go to the sheet, then the brochure downloads. */
  var brochureLinks = document.querySelectorAll('a[data-brochure]');

  if (brochureLinks.length && window.HTMLDialogElement) {
    var bDialog = document.createElement('dialog');
    bDialog.className = 'brochure-dialog';
    bDialog.setAttribute('aria-labelledby', 'brochure-title');
    bDialog.innerHTML =
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
    document.body.appendChild(bDialog);

    var bForm = bDialog.querySelector('form');
    var bThanks = bDialog.querySelector('.brochure-thanks');
    var bButton = bForm.querySelector('button[type="submit"]');
    var bError = bForm.querySelector('.form-status');

    Array.prototype.forEach.call(brochureLinks, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        bForm.reset();
        bForm.hidden = false;
        bThanks.hidden = true;
        bError.hidden = true;
        bDialog.showModal();
      });
    });

    bDialog.querySelector('.brochure-dialog__close').addEventListener('click', function () {
      bDialog.close();
    });

    // Click on the backdrop closes it
    bDialog.addEventListener('click', function (e) {
      if (e.target === bDialog) bDialog.close();
    });

    // Browser validation handles required fields and the email format
    bForm.addEventListener('submit', function (e) {
      e.preventDefault();
      bButton.disabled = true;
      bButton.textContent = 'Sending…';
      bError.hidden = true;

      sendForm('brochure', bForm)
        .then(function () {
          bForm.hidden = true;
          bThanks.hidden = false;
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
          bError.textContent = 'Something went wrong. Please try again.';
          bError.hidden = false;
        })
        .then(function () {
          bButton.disabled = false;
          bButton.textContent = 'Download';
        });
    });
  }

})();
