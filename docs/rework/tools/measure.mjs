// node docs/rework/tools/measure.mjs [pages...] [--base http://HOST:8765] [--root dir] [--out path]
// Scroll heights at 1440x900 and 390x844 (mobile emulation), section heights, footer, console errors, failed requests.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, close, sleep } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const base = opt('--base', 'http://' + ['127', '0', '0', '1'].join('.') + ':8765').replace(/\/$/, '');
const out = opt('--out', resolve(here, 'out', 'measure-latest.json'));
const pagesRoot = opt('--root', repo); // where to list pages from (baseline folder when measuring the old site)
const pages = args.length ? args : readdirSync(pagesRoot).filter((f) => f.endsWith('.html')).sort();

const SIZES = [{ k: 'desktop', w: 1440, h: 900, m: false }, { k: 'phone', w: 390, h: 844, m: true }];
const READ = `(() => {
  const h = (e) => Math.round(e.getBoundingClientRect().height);
  const secs = [...document.querySelectorAll('main > section')].map((s) => ({ name: s.id || (s.className || '').split(' ')[0] || 'section', px: h(s) }));
  const f = document.querySelector('footer');
  return { total: document.documentElement.scrollHeight, sections: secs, footer: f ? h(f) : 0 };
})()`;

const res = {};
try {
  const b = await launch();
  const page = await (await b.newPage()).init();
  for (const p of pages) {
    res[p] = {};
    for (const s of SIZES) {
      await page.viewport(s.w, s.h, s.m);
      await page.goto(`${base}/${p}`, 600);
      await page.scrollThrough(0.5, 120);
      await page.eval('scrollTo(0,0)');
      await sleep(400);
      const r = await page.eval(READ);
      res[p][s.k] = { ...r, vh: s.h, screens: +(r.total / s.h).toFixed(2), consoleErrors: [...page.consoleErrors], failed: [...page.failed] };
    }
  }
} finally { await close(); }

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(res, null, 2));
const pad = (v, n) => String(v).padEnd(n);
console.log(pad('page', 20) + pad('desk px', 9) + pad('scr', 6) + pad('phone px', 10) + pad('scr', 6) + pad('footer d/p', 12) + 'errs');
for (const [p, r] of Object.entries(res)) {
  const errs = r.desktop.consoleErrors.length + r.desktop.failed.length + r.phone.consoleErrors.length + r.phone.failed.length;
  console.log(pad(p, 20) + pad(r.desktop.total, 9) + pad(r.desktop.screens, 6) + pad(r.phone.total, 10) + pad(r.phone.screens, 6) + pad(r.desktop.footer + '/' + r.phone.footer, 12) + errs);
  for (const k of ['desktop', 'phone']) {
    console.log('   ' + k + ': ' + r[k].sections.map((s) => `${s.name}=${s.px}`).join(' '));
    for (const e of [...r[k].consoleErrors, ...r[k].failed]) console.log('   ! ' + k + ': ' + e);
  }
}
console.log('json: ' + out);
process.exit(0);
