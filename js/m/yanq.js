/* Phone behaviour: yanq
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation. Every effect is a pure
   function of scroll position: it stops when scrolling stops and reverses on
   the way back up. Under reduced motion nothing here runs, and the page
   keeps its static, finished layout. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }

  function toArray(list) { return Array.prototype.slice.call(list); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }


  /* ---------- Intro band, What is YanQ, What YanQ Delivers ----------
     Small scroll-linked touches, each a pure function of where its element
     sits on screen:
       --yq-band  0 to 1 as the intro photo band scrolls away (the photo
                  eases down a little, a slow parallax)
       --yq-hero  -1 to 1 across the What is YanQ section (the Q drifts)
       --yq-p     0 to 1 per Delivers card as it comes up the screen (it
                  rises, its bar draws and its numeral counts up); the
                  right-hand column trails the left a touch */
  function initTouches() {
    var band = document.querySelector('.yanq-hero-intro');
    var hero = document.querySelector('.yanq-hero');
    var cards = toArray(document.querySelectorAll('.deliver-stat'));
    var nums = cards.map(function (card) { return card.querySelector('.deliver-stat__num'); });
    var original = nums.map(function (num) { return num ? num.textContent : ''; });
    var on = false;
    var raf = null;

    function apply() {
      var vh = window.innerHeight;
      if (band) {
        var r = band.getBoundingClientRect();
        band.style.setProperty('--yq-band', clamp01(-r.top / Math.max(r.height, 1)).toFixed(4));
      }
      if (hero) {
        var h = hero.getBoundingClientRect();
        var hp = ((vh - h.top) / (vh + h.height)) * 2 - 1;
        hero.style.setProperty('--yq-hero', Math.max(-1, Math.min(1, hp)).toFixed(4));
      }
      cards.forEach(function (card, i) {
        var top = card.getBoundingClientRect().top;
        var lag = (i % 2) * 0.06 * vh;
        var p = smooth(clamp01((vh * 0.98 - top - lag) / (vh * 0.3)));
        card.style.setProperty('--yq-p', p.toFixed(4));
        var num = nums[i];
        if (num) {
          var target = parseInt(original[i], 10) || 0;
          var count = Math.round(p * target);
          var text = (count < 10 ? '0' : '') + count;
          if (num.textContent !== text) num.textContent = text;
        }
      });
    }

    function reset() {
      if (band) band.style.removeProperty('--yq-band');
      if (hero) hero.style.removeProperty('--yq-hero');
      cards.forEach(function (card, i) {
        card.style.removeProperty('--yq-p');
        if (nums[i]) nums[i].textContent = original[i];
      });
    }

    function sync() {
      var want = isPhone() && !reduce;
      if (want) {
        on = true;
        apply();
      } else if (on) {
        on = false;
        reset();
      }
    }

    sync();
    window.addEventListener('scroll', function () {
      if (on && raf === null) {
        raf = requestAnimationFrame(function () {
          raf = null;
          if (on) apply();
        });
      }
    }, { passive: true });
    phone.addEventListener('change', sync);
    window.addEventListener('resize', function () { if (on) apply(); });
  }

  initTouches();
}());
