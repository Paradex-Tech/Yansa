// node docs/rework/tools/shots.mjs <label> <page> [--w 1440,390] [--sel css] [--base url]
// node docs/rework/tools/shots.mjs <label> --nav [page]   (header at 1440..390, each drop-down open once)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, close, sleep, SCRATCH } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (n) => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
const base = opt('--base', 'http://' + ['127', '0', '0', '1'].join('.') + ':8765').replace(/\/$/, '');
const widths = opt('--w', '1440,390').split(',').map(Number);
const sel = opt('--sel', null);
const nav = flag('--nav');
const label = args[0];
const pageName = args[1] || 'index.html';
if (!label) { console.error('usage: shots.mjs <label> <page> [--w 1440,390] [--sel css] | <label> --nav [page]'); process.exit(2); }
const dir = join(SCRATCH, 'shots', label);
mkdirSync(dir, { recursive: true });
const stem = pageName.replace(/\.html$/, '');
const heightFor = (w) => (w <= 500 ? 844 : w <= 900 ? 1000 : 900);

const ONE_LINE = `(() => {
  const items = [...document.querySelectorAll('.navbar__links > a, .navbar__links > .nav-item')];
  const rs = items.map((e) => e.getBoundingClientRect());
  let overlap = false;
  for (let k = 1; k < rs.length; k++) if (rs[k].left < rs[k - 1].right - 0.5) overlap = true;
  const cta = document.querySelector('.navbar__cta').getBoundingClientRect();
  const logo = document.querySelector('.navbar__logo').getBoundingClientRect();
  if (cta.left < rs[rs.length - 1].right - 0.5 || rs[0].left < logo.right - 0.5) overlap = true;
  const rows = new Set(rs.map((r) => Math.round(r.top))).size;
  const wrapped = [...document.querySelectorAll('.navbar__links a, .navbar__cta')].some((a) => a.getBoundingClientRect().height > 40);
  return { header: Math.round(document.querySelector('.navbar').getBoundingClientRect().height), rows, overlap, wrapped, scrollW: document.documentElement.scrollWidth, cta: Math.round(cta.right) };
})()`;

try {
  const b = await launch();
  const page = await (await b.newPage()).init();
  const saved = [];
  if (nav) {
    for (const w of [1440, 1280, 1024, 900, 820, 769, 390]) {
      await page.viewport(w, heightFor(w), w <= 500);
      await page.goto(`${base}/${pageName}`, 700);
      const file = (suffix) => join(dir, `nav-${w}${suffix}.png`);
      if (w > 768) {
        const clip = { x: 0, y: 0, width: w, height: 330 };
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 700 });
        await sleep(300);
        await page.screenshot(file('-closed'), { ...clip, height: 100 }); saved.push(file('-closed'));
        for (const [name, idx] of [['solutions', 2], ['services', 3]]) {
          const pt = await page.eval(`(() => { const el = document.querySelectorAll('.navbar__links > a, .navbar__links > .nav-item')[${idx}]; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
          if (!pt) continue;
          await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
          await sleep(600);
          await page.screenshot(file('-' + name), clip); saved.push(file('-' + name));
          const fit = await page.eval(`(() => { const p = document.querySelectorAll('.nav-item')[${idx - 2}]?.querySelector('.nav-menu'); if (!p) return 'no panel'; const r = p.getBoundingClientRect(); return 'panel ' + Math.round(r.left) + '-' + Math.round(r.right) + ' of ' + innerWidth + ', visible=' + (getComputedStyle(p).visibility); })()`);
          console.log(`nav ${w} ${name}: ${fit}`);
          await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 700 });
          await sleep(450);
        }
        console.log(`nav ${w}: ` + JSON.stringify(await page.eval(ONE_LINE)));
      } else {
        await page.screenshot(file('-closed'), { x: 0, y: 0, width: w, height: 100 }); saved.push(file('-closed'));
        await page.eval(`document.querySelector('.navbar__toggle').click()`);
        await sleep(1000);
        await page.screenshot(file('-menu-open')); saved.push(file('-menu-open'));
      }
    }
  } else {
    for (const w of widths) {
      const h = heightFor(w);
      await page.viewport(w, h, w <= 500);
      await page.goto(`${base}/${pageName}`, 700);
      await page.eval('scrollTo(0,0)');
      const ys = [];
      const total = await page.eval('document.documentElement.scrollHeight');
      if (sel) {
        const r = await page.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; })()`);
        if (!r) { console.error('selector not found: ' + sel); continue; }
        for (let y = Math.max(0, r.top - 60); y < r.top + r.h; y += h * 0.9) ys.push(Math.round(y));
      } else {
        for (let y = 0; y < total; y += h) ys.push(y);
      }
      let cur = 0, n = 0;
      for (const y of ys) {
        // step toward y in small increments so scroll-linked motion is in its real state
        const dist = y - cur, steps = Math.max(1, Math.ceil(Math.abs(dist) / (h * 0.4)));
        for (let s = 1; s <= steps; s++) { await page.eval(`scrollTo(0, ${Math.round(cur + (dist * s) / steps)})`); await sleep(110); }
        cur = y; await sleep(350);
        const f = join(dir, `${stem}-${w}-${String(++n).padStart(2, '0')}.png`);
        await page.screenshot(f); saved.push(f);
      }
    }
  }
  console.log(saved.length + ' shots in ' + dir);
  for (const f of saved) console.log('  ' + f);
} finally { await close(); }
process.exit(0);
