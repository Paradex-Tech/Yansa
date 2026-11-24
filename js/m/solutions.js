/* Phone behaviour: solutions
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation.

   Serves solutions.html. Everything here is built by build() and taken apart
   by teardown(), so leaving the phone width (a rotation, a resized window)
   hands the page back to the desktop scripts with no classes, nodes or inline
   styles left behind. Time only drives the ambient glow on the hero (the wave
   itself is script.js's initPqWave, which settles on load and ignores touch). */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }


  /* ---------- Helpers ---------- */

  function toArray(list) {
    return Array.prototype.slice.call(list);
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

  // Strips the reveal from cards that start off to the side of a carousel:
  // they are clipped by the track, so the observer would only fire mid-swipe.
  function unreveal(items) {
    items.forEach(function (el, i) {
      if (i >= 2 && el.hasAttribute('data-reveal')) el.removeAttribute('data-reveal');
      else if (i < 2 && el.hasAttribute('data-reveal')) el.style.setProperty('--reveal-delay', i * 90 + 'ms');
    });
  }


  /* ---------- Snap carousel ----------
     The track is styled in css/m/solutions.css; this adds the dots, marks
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

  /* ---------- Solution rows ---------- */
  function initCarousels() {
    toArray(document.querySelectorAll('.solutions-row__grid')).forEach(function (grid) {
      carousel(grid, { label: 'Product' });
    });
  }


  /* ---------- Solutions hero: ambient glow ----------
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
    initCarousels();
    initPqHero();
    initSheet();
  }

  function teardown() {
    if (!built) return;
    built = false;
    while (undo.length) undo.pop()();
  }

  function sync() {
    if (isPhone()) build();
    else teardown();
  }

  if (phone.addEventListener) phone.addEventListener('change', sync);
  else if (phone.addListener) phone.addListener(sync);
  sync();

}());
