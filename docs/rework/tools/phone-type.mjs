// node docs/rework/tools/phone-type.mjs <width> [pages...]  -> type/tap/overflow/padding inventory at phone width
import { launch, close, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const [w0, ...pages0] = process.argv.slice(2);
const W = Number(w0 || 390), H = W === 360 ? 780 : 844;
const pages = pages0.length ? pages0 : ['index.html','about.html','solutions.html','services.html','yanq.html','know-your-loads.html','contact.html','404.html','privacy-policy.html','terms.html'];
const READ = `(() => {
  const out = { type: {}, taps: [], overflow: [], pads: [], sw: document.documentElement.scrollWidth };
  const sel = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '');
  const path = (e) => { const s = e.closest('section, footer, header, nav, dialog, .m-menu, [class*=menu]'); return (s ? (s.id || sel(s)) : '-') + ' ' + sel(e); };
  for (const e of document.querySelectorAll('body *')) {
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const k = Math.round(parseFloat(cs.fontSize)*10)/10 + '/' + cs.fontWeight + '/' + (cs.lineHeight === 'normal' ? 'n' : Math.round(parseFloat(cs.lineHeight)/parseFloat(cs.fontSize)*100)/100) + (cs.textTransform === 'uppercase' ? '/UP' : '') + ' ' + cs.fontFamily.split(',')[0].replace(/"/g,'');
    (out.type[k] = out.type[k] || new Set()).add(path(e));
  }
  for (const k in out.type) out.type[k] = [...out.type[k]].slice(0, 6).join(' | ') + (out.type[k].size > 6 ? ' +' + (out.type[k].size - 6) : '');
  for (const e of document.querySelectorAll('a, button, input, select, textarea, summary, [role=button]')) {
    const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (getComputedStyle(e).visibility === 'hidden') continue;
    if (r.height < 44 || r.width < 44) out.taps.push(path(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24) + '"');
  }
  for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed') { let p = e.parentElement, clipped = false; while (p) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { clipped = true; break; } p = p.parentElement; } if (!clipped) out.overflow.push(path(e) + ' r=' + Math.round(r.right)); } }
  out.overflow = out.overflow.slice(0, 8);
  for (const s of document.querySelectorAll('main > section, footer')) { const cs = getComputedStyle(s); out.pads.push((s.id || sel(s)) + ' ' + cs.paddingTop + '/' + cs.paddingBottom + ' h=' + Math.round(s.getBoundingClientRect().height)); }
  return out;
})()`;
const res = {};
try {
  const b = await launch();
  const page = await (await b.newPage()).init();
  for (const p of pages) {
    await page.viewport(W, H, true);
    await page.goto('http://127.0.0.1:8765/' + p, 900);
    const total = await page.eval('document.documentElement.scrollHeight');
    for (let y = 0; y <= total; y += 300) { await page.eval('scrollTo(0,' + y + ')'); await sleep(90); }
    await sleep(800);
    res[p] = await page.eval(READ);
  }
} finally { await close(); }
const f = 'C:/Users/Asus/AppData/Local/Temp/claude/1127f2370ec5f6b0/37fba964-ce4f-43d2-a765-6650c4ca23e9/scratchpad/phone/inv-' + W + '.json';
writeFileSync(f, JSON.stringify(res, null, 1));
console.log('wrote ' + f);
process.exit(0);
