/**
 * Concentric Waves Icon — vanilla JS + SVG, framework-agnostic.
 * Broken concentric rings ripple outward from a center dot and fade, looping forever.
 * No dependencies. Drop into any site (plain <script>, React useEffect, Vue mounted(), etc).
 *
 * Usage:
 *   <div id="wave-icon"></div>
 *   <script src="concentric-waves-icon.js"></script>
 *   <script>
 *     mountConcentricWaves(document.getElementById('wave-icon'), {
 *       size: 48,              // rendered px size (square)
 *       waveColor: '#eeece0',
 *       dotColor: '#ff8c40',  // optional; defaults to waveColor
 *       bgColor: 'transparent', // or a hex to draw a filled square behind it
 *       speed: 1,               // playback rate multiplier
 *       ringCount: 2,           // 2 or 3
 *       duration: 2,            // seconds per ring's full outward travel
 *     });
 *   </script>
 *
 * Returns a handle: { stop() } to cancel the animation (e.g. on unmount).
 */
(function (global) {
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // Piecewise-linear interpolation across multiple stops, with optional
  // per-segment easing applied to the local t within the active segment.
  function interpolate(inputs, outputs, easing) {
    return function (t) {
      if (t <= inputs[0]) return outputs[0];
      if (t >= inputs[inputs.length - 1]) return outputs[outputs.length - 1];
      for (let i = 0; i < inputs.length - 1; i++) {
        if (t >= inputs[i] && t <= inputs[i + 1]) {
          let localT = (t - inputs[i]) / (inputs[i + 1] - inputs[i]);
          if (easing) localT = easing(localT);
          return lerp(outputs[i], outputs[i + 1], localT);
        }
      }
      return outputs[outputs.length - 1];
    };
  }

  function arcPath(cx, cy, r, startDeg, endDeg) {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const x0 = cx + r * Math.cos(s), y0 = cy + r * Math.sin(s);
    const x1 = cx + r * Math.cos(e), y1 = cy + r * Math.sin(e);
    const span = mod(endDeg - startDeg, 360);
    const large = span > 180 ? 1 : 0;
    return (
      'M ' + x0.toFixed(3) + ' ' + y0.toFixed(3) +
      ' A ' + r.toFixed(3) + ' ' + r.toFixed(3) +
      ' 0 ' + large + ' 1 ' + x1.toFixed(3) + ' ' + y1.toFixed(3)
    );
  }

  // Irregular arc breaks per ring: varied span lengths and gap sizes, including
  // a diagonal segment — deliberately not a clean bisected/cardinal split.
  // Gaps between arc-ends stay >=35deg so round stroke caps never visually
  // touch, even at the smallest radius near the origin dot.
  const PATTERNS = {
    A: [[300, 350], [25, 140], [175, 255]],
    B: [[230, 290], [325, 30], [65, 190]],
    C: [[0, 100], [140, 210], [246, 320]],
  };
  const PATTERN_KEYS = ['A', 'B', 'C'];

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function mountConcentricWaves(container, opts) {
    opts = opts || {};
    const size = opts.size || 48;
    const waveColor = opts.waveColor || '#eeece0';
    // Added for this site: the centre dot can take its own colour.
    // Defaults to waveColor, so the handoff's behaviour is unchanged.
    const dotColor = opts.dotColor || waveColor;
    const bgColor = opts.bgColor || 'transparent';
    const speed = opts.speed || 1;
    const ringCount = opts.ringCount || 2;
    const duration = opts.duration || 2; // seconds for one ring to travel rMin -> rMax and fade

    const cx = 50, cy = 50;
    const rMin = 15, rMax = 44;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.display = 'block';
    if (bgColor && bgColor !== 'transparent') {
      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
      bg.setAttribute('width', '100'); bg.setAttribute('height', '100');
      bg.setAttribute('fill', bgColor);
      svg.appendChild(bg);
    }

    // Build ring groups, each with up to 3 arc <path> elements.
    const ringEls = [];
    for (let i = 0; i < ringCount; i++) {
      const g = document.createElementNS(SVG_NS, 'g');
      const pattern = PATTERNS[PATTERN_KEYS[i % PATTERN_KEYS.length]];
      const paths = pattern.map(function () {
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('stroke', waveColor);
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('fill', 'none');
        g.appendChild(p);
        return p;
      });
      svg.appendChild(g);
      ringEls.push({ g: g, paths: paths, pattern: pattern });
    }

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    dot.setAttribute('fill', dotColor);
    // Seed the radius the first frame would set, so the dot is drawn even
    // before rAF runs (a background tab can defer that indefinitely).
    dot.setAttribute('r', 8.5);
    svg.appendChild(dot);

    container.appendChild(svg);

    const radiusFn = interpolate([0, 1], [rMin, rMax], easeOutQuad);
    const opacityFn = interpolate([0, 0.12, 0.62, 1], [0, 1, 1, 0]);
    const widthFn = interpolate([0, 1], [7, 3]);
    const dotScaleFn = interpolate([0, 0.15, 1], [1, 1.16, 1], easeOutQuad);

    let rafId = null;
    const start = performance.now();

    function frame(now) {
      const T = ((now - start) / 1000) * speed;

      for (let i = 0; i < ringEls.length; i++) {
        const offset = (duration / ringCount) * i;
        const p = mod(T + offset, duration) / duration;
        const r = radiusFn(p);
        const opacity = opacityFn(p);
        const width = widthFn(p);
        const ring = ringEls[i];
        ring.g.setAttribute('opacity', opacity);
        ring.paths.forEach(function (pathEl, j) {
          const seg = ring.pattern[j];
          pathEl.setAttribute('d', arcPath(cx, cy, r, seg[0], seg[1]));
          pathEl.setAttribute('stroke-width', width);
        });
      }

      const pulsePeriod = duration / ringCount;
      const pulsePhase = mod(T, pulsePeriod) / pulsePeriod;
      const dotR = 8.5 * dotScaleFn(pulsePhase);
      dot.setAttribute('r', dotR);

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return {
      stop: function () {
        if (rafId) cancelAnimationFrame(rafId);
        container.removeChild(svg);
      },
    };
  }

  global.mountConcentricWaves = mountConcentricWaves;
})(window);
