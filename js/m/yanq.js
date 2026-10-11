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
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function mix(a, b, t) {
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ', ' +
      Math.round(lerp(a[1], b[1], t)) + ', ' + Math.round(lerp(a[2], b[2], t)) + ')';
  }

  /* ---------- Diagram player ----------
     The YanQ step diagrams carry their own playback marks, played on desktop
     by renderDiagram in js/script.js (private to its IIFE). This mirrors it:
       [data-a="type,a,b,x,y"]  animates while L runs from a to b:
         draw   stroke traces from its start (pathLength="1")
         fade   opacity 0 to 1
         pop    opacity 0 to 1, scale .6 to 1
         grow   scaleY 0 to 1 from the bottom
         slide  opacity 0 to 1, translate from (x, y) to rest
         rise   as slide, plus scale .92 to 1
         stream travels by (x, y) and fades out at the end
         drift  travels by (x, y) and stays
       [data-osc="period"]  slides left by `phase` periods (wrapping)
     The set-up properties are written on every frame too, because the
     desktop script clears them when it tears its own sequence down. */
  function diagramEase(v) {
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }

  function prepDiagram(svg) {
    return {
      els: toArray(svg.querySelectorAll('[data-a]')).map(function (el) {
        var p = el.getAttribute('data-a').split(',');
        return { el: el, type: p[0], a: +p[1], b: +p[2], x: +p[3] || 0, y: +p[4] || 0 };
      }),
      osc: toArray(svg.querySelectorAll('[data-osc]'))
    };
  }

  function playDiagram(d, L, phase) {
    d.els.forEach(function (o) {
      var e = diagramEase(clamp01((L - o.a) / (o.b - o.a)));
      var s = o.el.style;
      if (o.type === 'draw') {
        s.strokeDasharray = '1';
      } else {
        s.transformBox = 'fill-box';
        s.transformOrigin = o.type === 'grow' ? 'center bottom' : 'center';
      }
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
      el.style.transform = 'translateX(' + (-(phase * period % period)) + 'px)';
    });
  }

  function clearDiagram(d) {
    d.els.forEach(function (o) {
      ['stroke-dasharray', 'stroke-dashoffset', 'opacity', 'transform', 'transform-box',
        'transform-origin'].forEach(function (name) { o.el.style.removeProperty(name); });
    });
    d.osc.forEach(function (el) { el.style.removeProperty('transform'); });
  }


  /* ---------- How YanQ Works: the phone scene ----------
     The desktop sequence (initYanqFlow) is off at 768px and below; this is
     its portrait cut, under its own class (.yq-m-on). One sticky stage over
     a runway; positions in stage heights (u) since the stage stuck:
       ..   to READ   the statement reads along under the heading, on cream
       READ to TURN   cream turns to petrol; the statement rises away and the
                      card, rail and step text arrive
       TURN on        STEP per step: the step's text and diagram hand over
                      (out, then in) around each boundary, and its diagram
                      draws over the first BUILD of its share, then holds
       last OUT       outro: the steps leave upwards, petrol turns back to
                      cream, How/Works swap to What/Delivers and the real
                      What YanQ Delivers section rises into place beneath
     About a viewport per step, with slow smoothstep handovers. */
  function initFlow() {
    var flow = document.querySelector('.yanq-flow');
    if (!flow) return;
    var stage = flow.querySelector('.yanq-flow__stage');
    var stepsBox = flow.querySelector('.yanq-flow__steps');
    var intro = flow.querySelector('.yanq-flow__intro');
    var quote = flow.querySelector('.yanq-flow__quote');
    var steps = toArray(flow.querySelectorAll('.yanq-flow__step'));
    if (!stage || !stepsBox || !intro || !quote || !steps.length) return;

    var slots = steps.map(function (step) {
      return flow.querySelector('.yanq-anim[data-step="' + step.getAttribute('data-step') + '"]');
    });
    var svgs = slots.map(function (slot) {
      return slot ? slot.querySelector('svg.yanq-diagram') : null;
    });

    var n = steps.length;
    var READ = 0.5;     // the statement is fully read
    var TURN = 1.05;    // the colour change is complete, the steps are in
    var STEP = 0.85;    // stage heights per step
    var OUT = 1;        // the outro (the Delivers section rises one stage)
    var T = 0.16;       // share of a step either side of a boundary for the handover
    var BUILD = 0.62;   // share of a step over which its diagram draws
    var WAVE_CYCLES = 5;  // Measurement's screen wave, once it is drawn
    var RUNWAY = TURN + n * STEP + OUT;

    var CREAM = [250, 250, 239];
    var PETROL = [26, 65, 70];
    var INK = [23, 23, 23];
    var GREY = [152, 152, 152];

    var rail = null, track = null, fill = null, clipRect = null, marker = null, nodes = [];
    var words = [];
    var diagrams = [];
    var S = 1, stuckTop = 0, paraTop = 0;
    var W = 0, PAD = 8, MID = 12, AMP = 6;
    var on = false;
    var raf = null;

    function enabled() {
      return isPhone() && !reduce && window.innerHeight >= 520;
    }

    var SVGNS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, parent) {
      var node = document.createElementNS(SVGNS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      if (parent) parent.appendChild(node);
      return node;
    }

    function buildRail() {
      rail = document.createElement('div');
      rail.className = 'yq-rail';
      rail.setAttribute('aria-hidden', 'true');
      var svg = el('svg', { focusable: 'false' }, rail);
      var defs = el('defs', {}, svg);
      var clip = el('clipPath', { id: 'yq-rail-clip' }, defs);
      clipRect = el('rect', { x: '-4', y: '-4', width: '0', height: '32' }, clip);
      track = el('path', { 'class': 'yq-rail__track', fill: 'none', 'stroke-width': '1.6', 'stroke-dasharray': '3 4', 'stroke-linecap': 'round' }, svg);
      fill = el('path', { 'class': 'yq-rail__fill', fill: 'none', 'stroke-width': '1.8', 'stroke-dasharray': '3 4', 'stroke-linecap': 'round', 'clip-path': 'url(#yq-rail-clip)' }, svg);
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push(el('circle', { 'class': 'yq-rail__node', r: '3.5', 'stroke-width': '1.4', cy: String(MID) }, svg));
      }
      marker = el('circle', { 'class': 'yq-rail__marker', r: '5', 'stroke-width': '8', cy: String(MID) }, svg);
      stepsBox.appendChild(rail);
    }

    // One full swing of the wave between neighbouring nodes, which sit on
    // its centre line
    function waveY(px) {
      var seg = (W - 2 * PAD) / Math.max(n - 1, 1);
      return MID - AMP * Math.sin(2 * Math.PI * (px - PAD) / seg);
    }

    function drawRail() {
      W = rail.clientWidth || 1;
      var d = 'M0,' + waveY(0).toFixed(2);
      for (var x = 3; x <= W; x += 3) d += ' L' + x + ',' + waveY(x).toFixed(2);
      d += ' L' + W + ',' + waveY(W).toFixed(2);
      track.setAttribute('d', d);
      fill.setAttribute('d', d);
      var seg = (W - 2 * PAD) / Math.max(n - 1, 1);
      nodes.forEach(function (node, i) { node.setAttribute('cx', (PAD + i * seg).toFixed(2)); });
    }

    function travelled() {
      return stuckTop - flow.getBoundingClientRect().top;
    }

    function measure() {
      S = stage.getBoundingClientRect().height || 1;
      stuckTop = parseFloat(getComputedStyle(stage).top) || 0;
      // The statement's top while pinned, measured at rest
      flow.style.setProperty('--yq-intro', '1');
      paraTop = stuckTop + (quote.getBoundingClientRect().top - stage.getBoundingClientRect().top);
      drawRail();
    }

    // A step's visibility around the boundaries either side of it: the
    // outgoing one leaves over [k - T, k], the incoming arrives over
    // [k, k + T]. dy runs -1 (gone up) .. 0 .. 1 (still below).
    function stepState(x, i) {
      var inn = i === 0 ? 1 : smooth(clamp01((x - i) / T));
      var out = i === n - 1 ? 0 : smooth(clamp01((x - (i + 1 - T)) / T));
      return { v: inn * (1 - out), dy: (1 - inn) - out };
    }

    function apply() {
      var t = travelled();
      var u = t / S;

      // Read-along: from the statement reaching 75% of the screen on the
      // way in to READ stage heights into the pin
      if (words.length) {
        var start = paraTop - window.innerHeight * 0.75;
        var end = READ * S;
        var rp = end <= start ? 1 : clamp01((t - start) / (end - start));
        quote.style.setProperty('--quote-rail', rp.toFixed(4));
        var edge = rp * (words.length + 1);
        for (var w = 0; w < words.length; w++) words[w].classList.toggle('yq-lit', edge >= w + 1);
      }

      var turnLen = TURN - READ;
      var turn = smooth(clamp01((u - READ) / turnLen));
      // The statement is gone before the card arrives, so the two never
      // overlap
      var introOut = smooth(clamp01((u - READ) / (turnLen * 0.5)));
      var reveal = smooth(clamp01((u - READ - turnLen * 0.5) / (turnLen * 0.5)));
      var out = clamp01((u - (RUNWAY - OUT)) / OUT);
      var swap = smooth(clamp01((out - 0.15) / 0.55));

      flow.style.setProperty('--yq-bg', out > 0 ?
        mix(PETROL, CREAM, smooth(clamp01(out / 0.7))) : mix(CREAM, PETROL, turn));
      // The heading crosses from ink to grey quickly, mid-turn, so it is
      // never long the same tone as the background behind it
      flow.style.setProperty('--yq-title', mix(INK, GREY, smooth(clamp01((turn - 0.62) / 0.22))));
      flow.style.setProperty('--yq-intro', (1 - introOut).toFixed(4));
      flow.style.setProperty('--yq-reveal', reveal.toFixed(4));
      flow.style.setProperty('--yq-out', out.toFixed(4));
      flow.style.setProperty('--yq-swap', swap.toFixed(4));

      // Where in the steps we are: 0 to n
      var x = clamp01((u - TURN) / (n * STEP)) * n;

      // Measurement's screen wave keeps sliding once it is drawn, to the
      // end of the list
      var oscFrom = T + BUILD;
      var phase = clamp01((x - oscFrom) / Math.max(n - oscFrom, 0.001)) * WAVE_CYCLES;

      steps.forEach(function (step, i) {
        var st = stepState(x, i);
        step.style.setProperty('--yq-v', st.v.toFixed(4));
        step.style.setProperty('--yq-dy', st.dy.toFixed(4));
        var slot = slots[i];
        if (slot) {
          slot.style.setProperty('--yq-v', st.v.toFixed(4));
          slot.style.setProperty('--yq-dy', st.dy.toFixed(4));
        }
        // Each diagram draws after its text has arrived, then holds;
        // the first one waits for the colour change
        if (diagrams[i]) {
          var L = clamp01((x - i - (i === 0 ? 0.02 : T * 0.5)) / BUILD);
          playDiagram(diagrams[i], L, phase);
        }
      });

      // Rail: the marker parks on a step's node and travels the swing to
      // the next during each handover; the trail behind it is orange
      var m = 0;
      for (var k = 1; k < n; k++) m += smooth(clamp01((x - (k - T)) / (2 * T)));
      var seg = (W - 2 * PAD) / Math.max(n - 1, 1);
      var mx = PAD + m * seg;
      marker.setAttribute('cx', mx.toFixed(2));
      marker.setAttribute('cy', waveY(mx).toFixed(2));
      clipRect.setAttribute('width', (mx + 4).toFixed(2));
      nodes.forEach(function (node, i) { node.classList.toggle('is-on', m >= i - 0.02); });
      // The dashes drift slowly along the wave as the page scrolls
      var drift = (-x * 21).toFixed(2);
      track.style.strokeDashoffset = drift;
      fill.style.strokeDashoffset = drift;
    }

    function frame() {
      raf = null;
      if (on) apply();
    }

    function setup() {
      flow.classList.add('yq-m-on');
      flow.style.setProperty('--yq-runway', RUNWAY.toFixed(3));
      if (!rail) buildRail();
      words = toArray(quote.querySelectorAll('.quote__word'));
      diagrams = svgs.map(function (svg) { return svg ? prepDiagram(svg) : null; });
      on = true;
      measure();
      apply();
    }

    function teardown() {
      on = false;
      flow.classList.remove('yq-m-on');
      ['--yq-runway', '--yq-bg', '--yq-title', '--yq-intro', '--yq-reveal', '--yq-out',
        '--yq-swap'].forEach(function (name) { flow.style.removeProperty(name); });
      quote.style.removeProperty('--quote-rail');
      words.forEach(function (w) { w.classList.remove('yq-lit'); });
      steps.concat(slots).forEach(function (node) {
        if (!node) return;
        node.style.removeProperty('--yq-v');
        node.style.removeProperty('--yq-dy');
      });
      diagrams.forEach(function (d) { if (d) clearDiagram(d); });
      diagrams = [];
      if (rail && rail.parentNode) rail.parentNode.removeChild(rail);
      rail = null;
    }

    function sync() {
      if (enabled()) {
        if (!on) setup();
        else { measure(); apply(); }
      } else if (on || flow.classList.contains('yq-m-on')) {
        teardown();
      }
    }

    sync();
    window.addEventListener('scroll', function () {
      if (on && raf === null) raf = requestAnimationFrame(frame);
    }, { passive: true });
    phone.addEventListener('change', sync);
    var timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(sync, 150);
    });
    window.addEventListener('load', sync);
  }


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

  initFlow();
  initTouches();
}());
