/* Phone behaviour: base
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation.

   Builds the shared phone chrome on every page:
     menu    a full-screen menu inside the navbar. script.js still owns the
             open state (.navbar.is-open + aria-expanded on the toggle,
             initMobileNav); this only watches that class and adds the scroll
             lock, focus handling and inert page behind it.
     bar     the sticky "Book a Diagnosis" pill at the bottom of the screen
     footer  a small end row (copyright, back to top)
     sheet   the brochure dialog (initBrochure) as a draggable bottom sheet
   Everything injected is removed again when the screen grows past 768px. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }

  var root = document.documentElement;
  var navbar = document.querySelector('.navbar');
  var toggle = navbar && navbar.querySelector('.navbar__toggle');

  var ARROW = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11.5M11 5.5 15.5 10 11 14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var UP = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var teardowns = [];   // undo functions for the current phone session
  var active = false;

  function listen(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    teardowns.push(function () { el.removeEventListener(type, fn, opts); });
  }

  function observe(el, opts, fn) {
    var mo = new MutationObserver(fn);
    mo.observe(el, opts);
    teardowns.push(function () { mo.disconnect(); });
  }

  function toArray(list) { return Array.prototype.slice.call(list); }

  function menuOpen() { return !!navbar && navbar.classList.contains('is-open'); }

  /* ---------- Scroll lock ----------
     Shared by the menu and the sheet: locked while either wants it. */
  var locks = {};
  function lock(reason, on) {
    if (on) locks[reason] = true;
    else delete locks[reason];
    root.classList.toggle('m-lock', Object.keys(locks).length > 0);
  }


  /* ---------- Menu ---------- */
  function buildMenu() {
    if (!navbar || !toggle) return;
    var links = toArray(navbar.querySelectorAll('.navbar__links a'));
    if (!links.length) return;

    var menu = document.createElement('nav');
    menu.className = 'm-menu';
    menu.id = 'm-menu';
    menu.setAttribute('aria-label', 'Main');
    menu.tabIndex = -1;

    var html = '<p class="m-menu__label" aria-hidden="true" style="--i:0">Menu</p><div class="m-menu__list">';
    links.forEach(function (link, i) {
      var current = link.classList.contains('is-active') || link.getAttribute('aria-current') === 'page';
      html += '<a class="m-menu__link" style="--i:' + (i + 1) + '" href="' + link.getAttribute('href') + '"' +
        (current ? ' aria-current="page"' : '') + '>' +
        '<span class="m-menu__num" aria-hidden="true">0' + (i + 1) + '</span>' +
        '<span class="m-menu__text">' + link.textContent.trim() + '</span>' +
        '<span class="m-menu__go">' + ARROW + '</span></a>';
    });
    html += '</div>';

    var cta = navbar.querySelector('.navbar__cta');
    var brochure = document.querySelector('.footer a[data-brochure]') || document.querySelector('a[data-brochure]');
    var note = document.querySelector('.footer__cta p');
    html += '<div class="m-menu__foot" style="--i:' + (links.length + 1) + '">';
    if (cta) {
      html += '<a class="m-menu__cta" href="' + cta.getAttribute('href') + '">' +
        cta.textContent.trim() + ARROW + '</a>';
    }
    if (note || brochure) {
      html += '<div class="m-menu__sub">' +
        (note ? '<p class="m-menu__note">' + note.textContent.trim() + '</p>' : '<span></span>') +
        (brochure ? '<a class="m-menu__brochure" href="' + brochure.getAttribute('href') + '">' +
          brochure.textContent.trim() + '</a>' : '') +
        '</div>';
    }
    html += '</div>';
    menu.innerHTML = html;
    navbar.appendChild(menu);

    var oldControls = toggle.getAttribute('aria-controls');
    toggle.setAttribute('aria-controls', 'm-menu');

    // script.js owns the state: closing goes through its toggle handler
    function close() {
      if (menuOpen()) toggle.click();
    }

    toArray(menu.querySelectorAll('a')).forEach(function (a) {
      listen(a, 'click', function (event) {
        if (a.classList.contains('m-menu__brochure') && brochure) {
          event.preventDefault();
          close();
          brochure.click();
          return;
        }
        lock('menu', false);  // before an in-page jump, not after
        close();
      });
    });

    var behind = [];
    function setInert(on) {
      if (on) {
        behind = toArray(document.body.children).filter(function (el) {
          return el !== navbar && el.tagName !== 'SCRIPT' && el.tagName !== 'DIALOG' && !el.inert;
        });
        behind.forEach(function (el) { el.inert = true; });
      } else {
        behind.forEach(function (el) { el.inert = false; });
        behind = [];
      }
    }

    var wasOpen = false;
    function sync() {
      var open = menuOpen();
      if (open === wasOpen) return;
      wasOpen = open;
      lock('menu', open);
      setInert(open);
      if (open) {
        // The panel itself takes focus (no ring on a tap); Tab goes on to the links
        menu.focus({ preventScroll: true });
      } else if (menu.contains(document.activeElement)) {
        toggle.focus({ preventScroll: true });
      }
    }
    observe(navbar, { attributes: true, attributeFilter: ['class'] }, sync);

    // Keep Tab inside the bar + menu while it is open
    listen(document, 'keydown', function (event) {
      if (event.key !== 'Tab' || !menuOpen()) return;
      var items = toArray(navbar.querySelectorAll('.navbar__logo, .navbar__toggle, .m-menu a'));
      var first = items[0];
      var last = items[items.length - 1];
      if (document.activeElement === menu) {
        event.preventDefault();
        (event.shiftKey ? last : menu.querySelector('a')).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Back/forward cache can restore a page with the menu still open
    listen(window, 'pageshow', function (event) {
      if (event.persisted) close();
    });

    teardowns.push(function () {
      close();
      setInert(false);
      lock('menu', false);
      wasOpen = false;
      menu.remove();
      if (oldControls) toggle.setAttribute('aria-controls', oldControls);
    });
  }


  /* ---------- Bottom bar ----------
     Shows once about a screen has been scrolled. Hides near the footer CTA,
     while the menu or any dialog is open, while a field has focus (the
     keyboard is up), and for a moment during a fast flick down. Not built on
     the contact page (the form is the page) or the 404. */
  function buildBar() {
    if (document.getElementById('contact-form') || document.querySelector('.not-found')) return;
    var cta = navbar && navbar.querySelector('.navbar__cta');
    var href = cta ? cta.getAttribute('href') : 'contact.html#contact-form';
    var label = cta ? cta.textContent.trim() : 'Book a Diagnosis';

    var bar = document.createElement('div');
    bar.className = 'm-bar';
    bar.innerHTML = '<a class="m-bar__btn" href="' + href + '">' + label + ARROW + '</a>';
    document.body.appendChild(bar);
    var btn = bar.firstChild;

    var footerMark = document.querySelector('.footer__cta') || document.querySelector('.footer');
    var lastY = window.pageYOffset;
    var lastT = performance.now();
    var tucked = false;
    var tuckTimer = 0;
    var queued = false;
    var shown = null;

    function typing() {
      var el = document.activeElement;
      if (!el || el === document.body) return false;
      if (el.isContentEditable) return true;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
      if (el.tagName !== 'INPUT') return false;
      return !/^(button|submit|reset|checkbox|radio|range|color|file|image|hidden)$/i.test(el.type);
    }

    function dialogOpen() {
      return !!document.querySelector('dialog[open]') ||
        document.body.classList.contains('sol-dialog-open');
    }

    function update() {
      queued = false;
      var vh = window.innerHeight;
      var past = window.pageYOffset > vh * 0.85;
      var nearEnd = footerMark && footerMark.getBoundingClientRect().top < vh - 24;
      var show = past && !nearEnd && !tucked && !menuOpen() && !dialogOpen() && !typing();
      if (show === shown) return;
      shown = show;
      bar.classList.toggle('is-shown', show);
      root.classList.toggle('m-bar-on', show);
      btn.tabIndex = show ? 0 : -1;
      if (show) btn.removeAttribute('aria-hidden');
      else btn.setAttribute('aria-hidden', 'true');
    }

    function queue() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }

    listen(window, 'scroll', function () {
      var y = window.pageYOffset;
      var t = performance.now();
      var dy = y - lastY;
      var dt = Math.max(t - lastT, 1);
      if (dy > 0 && dy / dt > 1.4 && !reduce) {
        tucked = true;
        clearTimeout(tuckTimer);
        tuckTimer = setTimeout(function () { tucked = false; queue(); }, 450);
      } else if (dy < -6) {
        tucked = false;
        clearTimeout(tuckTimer);
      }
      lastY = y;
      lastT = t;
      queue();
    }, { passive: true });

    listen(window, 'resize', queue);
    listen(document, 'focusin', queue);
    listen(document, 'focusout', function () { setTimeout(queue, 60); });
    observe(document.body, { attributes: true, attributeFilter: ['class', 'open'], subtree: true }, function (records) {
      // Only the menu, body and dialog changes matter; ignore the rest cheaply
      for (var i = 0; i < records.length; i++) {
        var t = records[i].target;
        if (t === document.body || t === navbar || t.tagName === 'DIALOG') { queue(); return; }
      }
    });

    update();

    teardowns.push(function () {
      clearTimeout(tuckTimer);
      bar.remove();
      root.classList.remove('m-bar-on');
    });
  }


  /* ---------- Footer end row ---------- */
  function buildFooterEnd() {
    var footer = document.querySelector('.footer');
    if (!footer) return;
    var end = document.createElement('div');
    end.className = 'm-footer-end';
    end.innerHTML = '<small>&copy; ' + new Date().getFullYear() + ' Yansa</small>' +
      '<button type="button">Back to top<span>' + UP + '</span></button>';
    footer.appendChild(end);

    listen(end.querySelector('button'), 'click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var logo = document.querySelector('.navbar__logo');
      if (logo) logo.focus({ preventScroll: true });
    });

    teardowns.push(function () { end.remove(); });
  }


  /* ---------- Brochure sheet ----------
     The dialog from initBrochure rises from the bottom (CSS). Here: an
     animated close (every close path in script.js calls dialog.close(), so
     the instance's close is wrapped), Escape through the same path, a scroll
     lock, and drag-down-to-dismiss from the top of the sheet. */
  function buildSheet() {
    var dialog = document.querySelector('.brochure-dialog');
    if (!dialog) return;
    var nativeClose = HTMLDialogElement.prototype.close;
    var closing = false;

    function finish(value) {
      closing = false;
      dialog.classList.remove('is-closing', 'is-ready', 'is-dragging', 'is-settling');
      dialog.style.removeProperty('--m-drag');
      dialog.style.transform = '';
      nativeClose.call(dialog, value);
    }

    dialog.close = function (value) {
      if (!dialog.open || closing) return;
      if (reduce || !isPhone()) { finish(value); return; }
      closing = true;
      dialog.classList.remove('is-dragging', 'is-settling');
      dialog.classList.add('is-closing');
      var done = false;
      var end = function () {
        if (done) return;
        done = true;
        dialog.removeEventListener('animationend', onEnd);
        finish(value);
      };
      var onEnd = function (event) { if (event.target === dialog) end(); };
      dialog.addEventListener('animationend', onEnd);
      setTimeout(end, 650);
    };

    listen(dialog, 'cancel', function (event) {
      event.preventDefault();
      dialog.close();
    });

    // Opening animation runs once; after it the sheet is free to be dragged
    listen(dialog, 'animationend', function (event) {
      if (event.target === dialog && !closing) dialog.classList.add('is-ready');
    });

    observe(dialog, { attributes: true, attributeFilter: ['open'] }, function () {
      lock('sheet', dialog.open);
      if (!dialog.open) dialog.classList.remove('is-ready');
    });

    // Drag to dismiss
    var startY = 0;
    var startX = 0;
    var startT = 0;
    var offset = 0;
    var dragging = false;
    var tracking = false;

    listen(dialog, 'touchstart', function (event) {
      if (closing || event.touches.length !== 1) return;
      tracking = dialog.scrollTop <= 0;
      dragging = false;
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
      startT = performance.now();
      offset = 0;
    }, { passive: true });

    listen(dialog, 'touchmove', function (event) {
      if (!tracking) return;
      var dy = event.touches[0].clientY - startY;
      var dx = event.touches[0].clientX - startX;
      if (!dragging) {
        if (dy > 8 && dy > Math.abs(dx)) {
          dragging = true;
          startY = event.touches[0].clientY;
          startT = performance.now();
          dialog.classList.remove('is-settling');
          dialog.classList.add('is-dragging', 'is-ready');
          if (document.activeElement && dialog.contains(document.activeElement)) document.activeElement.blur();
        } else if (dy < -4) {
          tracking = false;
          return;
        } else {
          return;
        }
      }
      event.preventDefault();
      offset = Math.max(0, event.touches[0].clientY - startY);
      dialog.style.transform = 'translateY(' + offset + 'px)';
    }, { passive: false });

    function release() {
      if (!dragging) { tracking = false; return; }
      dragging = false;
      tracking = false;
      var v = offset / Math.max(performance.now() - startT, 1);
      dialog.classList.remove('is-dragging');
      if (offset > Math.min(140, dialog.offsetHeight * 0.28) || (v > 0.55 && offset > 30)) {
        dialog.style.setProperty('--m-drag', offset + 'px');
        dialog.style.transform = '';
        dialog.close();
      } else {
        dialog.classList.add('is-settling');
        dialog.style.transform = '';
        setTimeout(function () { dialog.classList.remove('is-settling'); }, 480);
      }
    }
    listen(dialog, 'touchend', release);
    listen(dialog, 'touchcancel', release);

    teardowns.push(function () {
      delete dialog.close;  // back to the prototype's close
      dialog.classList.remove('is-closing', 'is-ready', 'is-dragging', 'is-settling');
      dialog.style.transform = '';
      dialog.style.removeProperty('--m-drag');
      lock('sheet', false);
    });
  }


  /* ---------- Build / tear down with the breakpoint ---------- */
  function setup() {
    if (active) return;
    active = true;
    buildMenu();
    buildFooterEnd();
    buildSheet();
    buildBar();
  }

  function teardown() {
    if (!active) return;
    active = false;
    while (teardowns.length) teardowns.pop()();
    root.classList.remove('m-lock');
    locks = {};
  }

  function onChange() {
    if (isPhone()) setup();
    else teardown();
  }

  if (phone.addEventListener) phone.addEventListener('change', onChange);
  else phone.addListener(onChange);
  onChange();

}());
