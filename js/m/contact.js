/* Phone behaviour: contact (contact.html and 404.html)
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation. Each feature has a build
   and a teardown, so leaving the phone width puts the DOM back as it was.
   The form's sending stays in js/script.js (initContactForm). */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }

  function toArray(list) { return Array.prototype.slice.call(list); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }


  /* ---------- The form ----------
     - Return on a one-line field moves to the next field (the fields carry
       enterkeyhint="next"), so the keyboard walks the form top to bottom.
     - A field is checked when it is left, and every field when a send is
       tried; the message under it is the browser's own validation text,
       replacing the native bubble, which floats awkwardly on phones. The
       first invalid field is brought to the middle of the screen.
     - The message box grows with what is typed.
     - When a field takes focus the keyboard covers the lower half; once the
       visual viewport has shrunk, the field is eased into the space above. */
  var form = (function () {
    var el = document.getElementById('contact-form');
    if (!el) return null;
    var fields = toArray(el.querySelectorAll('.form-field'));
    var controls = toArray(el.querySelectorAll('.form-field input, .form-field textarea'));
    var area = el.querySelector('textarea');
    var touched = [];
    var focusTimer = null;

    function fieldOf(control) { return control.closest('.form-field'); }

    function errorBox(field) {
      var box = field.querySelector('.m-field-error');
      if (!box) {
        box = document.createElement('p');
        box.className = 'm-field-error';
        box.setAttribute('aria-live', 'polite');
        box.appendChild(document.createElement('span'));
        field.appendChild(box);
      }
      return box;
    }

    function check(control) {
      var field = fieldOf(control);
      if (!field) return true;
      var ok = control.checkValidity();
      field.classList.toggle('is-m-invalid', !ok);
      control.setAttribute('aria-invalid', ok ? 'false' : 'true');
      var box = errorBox(field);
      if (!ok) {
        box.firstChild.textContent = control.validationMessage;
        if (!box.id) box.id = control.id + '-m-error';
        control.setAttribute('aria-describedby', box.id);
      }
      return ok;
    }

    function grow() {
      if (!area) return;
      area.style.height = 'auto';
      area.style.height = area.scrollHeight + 2 + 'px';
    }

    function onKeydown(e) {
      var t = e.target;
      if (e.key !== 'Enter' || t.tagName !== 'INPUT') return;
      var i = controls.indexOf(t);
      if (i < 0 || i === controls.length - 1) return;
      e.preventDefault();
      controls[i + 1].focus();
    }

    function onBlur(e) {
      var t = e.target;
      if (controls.indexOf(t) < 0) return;
      // An empty field that was only passed through is not an error yet
      if (!t.value && touched.indexOf(t) < 0) return;
      check(t);
    }

    function onInput(e) {
      var t = e.target;
      if (controls.indexOf(t) < 0) return;
      if (touched.indexOf(t) < 0) touched.push(t);
      if (t === area) grow();
      if (fieldOf(t).classList.contains('is-m-invalid')) check(t);
    }

    var firstBad = null;
    function onInvalid(e) {
      e.preventDefault(); // our message instead of the native bubble
      check(e.target);
      if (!firstBad) {
        firstBad = e.target;
        window.setTimeout(function () {
          var bad = firstBad;
          firstBad = null;
          if (!bad) return;
          bad.focus({ preventScroll: true });
          bad.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        }, 0);
      }
    }

    function onFocus(e) {
      var t = e.target;
      if (controls.indexOf(t) < 0 || !window.visualViewport) return;
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(function () {
        var vv = window.visualViewport;
        var r = fieldOf(t).getBoundingClientRect();
        var nav = document.querySelector('.navbar');
        var top = (nav ? nav.getBoundingClientRect().bottom : 64) + 12;
        var bottom = vv.height - 16;
        if (r.bottom > bottom || r.top < top) {
          window.scrollBy({ top: r.top - top, behavior: reduce ? 'auto' : 'smooth' });
        }
      }, 420);
    }

    // After a successful send script.js resets the form: clear our state too
    function onReset() {
      window.setTimeout(function () {
        touched = [];
        fields.forEach(function (f) { f.classList.remove('is-m-invalid'); });
        controls.forEach(function (c) { c.removeAttribute('aria-invalid'); });
        grow();
      }, 0);
    }

    function build() {
      el.addEventListener('keydown', onKeydown);
      el.addEventListener('focusout', onBlur);
      el.addEventListener('input', onInput);
      el.addEventListener('invalid', onInvalid, true);
      el.addEventListener('focusin', onFocus);
      el.addEventListener('reset', onReset);
      grow();
    }

    function teardown() {
      el.removeEventListener('keydown', onKeydown);
      el.removeEventListener('focusout', onBlur);
      el.removeEventListener('input', onInput);
      el.removeEventListener('invalid', onInvalid, true);
      el.removeEventListener('focusin', onFocus);
      el.removeEventListener('reset', onReset);
      window.clearTimeout(focusTimer);
      touched = [];
      fields.forEach(function (f) {
        f.classList.remove('is-m-invalid');
        var box = f.querySelector('.m-field-error');
        if (box) box.parentNode.removeChild(box);
      });
      controls.forEach(function (c) {
        c.removeAttribute('aria-invalid');
        if (/-m-error$/.test(c.getAttribute('aria-describedby') || '')) c.removeAttribute('aria-describedby');
      });
      if (area) area.style.height = '';
    }

    return { build: build, teardown: teardown };
  }());


  /* ---------- Map: settles as it scrolls in ----------
     Scroll-linked: the photo starts 8% enlarged as the card enters at the
     bottom of the screen and reaches rest by the time it is a third of the
     way up. A pure function of scroll, so it reverses on the way back. */
  var map = (function () {
    var box = document.querySelector('.contact-map');
    if (!box || reduce) return null;
    var frame = null;

    function paint() {
      frame = null;
      var r = box.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = clamp01((vh - r.top) / (vh * 0.7));
      var e = 1 - Math.pow(1 - p, 3);
      box.style.setProperty('--m-map-zoom', (1.08 - 0.08 * e).toFixed(4));
    }

    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(paint);
    }

    return {
      build: function () {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        paint();
      },
      teardown: function () {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        box.style.removeProperty('--m-map-zoom');
      }
    };
  }());


  /* ---------- Build / tear down with the phone width ---------- */
  var parts = [form, map].filter(Boolean);
  var built = false;

  function onChange() {
    if (isPhone() && !built) {
      built = true;
      parts.forEach(function (p) { p.build(); });
    } else if (!isPhone() && built) {
      built = false;
      parts.forEach(function (p) { p.teardown(); });
    }
  }

  if (phone.addEventListener) phone.addEventListener('change', onChange);
  else if (phone.addListener) phone.addListener(onChange);
  onChange();
}());
