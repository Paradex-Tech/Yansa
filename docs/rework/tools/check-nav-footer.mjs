// node docs/rework/tools/check-nav-footer.mjs [-v] : nav + footer links of every public page must match index.html apart
// from the active state, page-local anchors and hidden links. 404 uses root-absolute hrefs and has no CTA block.
// Also checks: the one active item per page (YanQ = Services), both drop-downs, phone toggle, base phone css/js.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
const grab = (s, re) => (s.match(re) || [''])[0];
const NAV = /<header class="navbar">[\s\S]*?<\/header>/;
const bottom = (f) => grab(f, /<div class="footer__bottom">[\s\S]*<\/footer>/);
const norm = (s, p) => s
  .replaceAll(`href="${p}#`, 'href="#')
  .replace(/\s*aria-current="page"/g, '').replace(/\s*is-active/g, '').replace(/class=""/g, '')
  .replace(/(href|src)="\/(?!\/)/g, '$1="')
  .replaceAll('href=""', 'href="./"')
  .replace(/\s+"/g, '"').replace(/\s+>/g, '>')
  .replace(/<a [^>]*\bhidden>[^<]*<\/a>/g, '')
  .replace(/\s+/g, ' ').trim();
const ACTIVE = { 'index.html': 'Home', 'about.html': 'About Us', 'solutions.html': 'Solutions', 'services.html': 'Services',
  'yanq.html': 'Services', 'know-your-loads.html': 'Know Your Loads', 'contact.html': 'Contact' };
const ref = readFileSync(join(root, 'index.html'), 'utf8');
const diff = (a, b) => {
  if (!process.argv.includes('-v')) return '';
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return ` @${i}: ${JSON.stringify(a.slice(Math.max(0, i - 20), i + 50))} vs ${JSON.stringify(b.slice(Math.max(0, i - 20), i + 50))}`;
};
const fails = [];
for (const p of pages) {
  const s = readFileSync(join(root, p), 'utf8');
  const nav = grab(s, NAV);
  const foot = grab(s, /<footer class="footer">[\s\S]*?<\/footer>/);
  if (!nav) { fails.push(`${p}: no navbar`); continue; }
  const refNav = norm(grab(ref, NAV), p), refFoot = norm(bottom(grab(ref, /<footer class="footer">[\s\S]*?<\/footer>/)), p);
  if (norm(nav, p) !== refNav) fails.push(`${p}: nav differs from index.html${diff(norm(nav, p), refNav)}`);
  const nf = norm(bottom(foot), p);
  if (p === '404.html') { if (!nf.includes('footer__links')) fails.push(`${p}: no footer links`); }
  else {
    if (!foot.includes('footer__cta')) fails.push(`${p}: footer CTA block missing`);
    if (nf !== refFoot) fails.push(`${p}: footer differs from index.html${diff(nf, refFoot)}`);
  }
  const act = [...nav.matchAll(/<a [^>]*class="[^"]*is-active[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
  const want = ACTIVE[p];
  if (want && (act.length !== 1 || act[0] !== want)) fails.push(`${p}: active item ${JSON.stringify(act)}, want ${want}`);
  if (!want && act.length) fails.push(`${p}: unexpected active item ${act}`);
  for (const id of ['nav-menu-solutions', 'nav-menu-services']) if (!nav.includes(`id="${id}"`)) fails.push(`${p}: missing ${id}`);
  if (!nav.includes('navbar__toggle')) fails.push(`${p}: no phone toggle`);
  if (!/css\/m\/base\.css/.test(s)) fails.push(`${p}: base phone css not linked`);
  if (!/js\/m\/base\.js/.test(s)) fails.push(`${p}: base phone js not loaded`);
}
console.log(`check-nav-footer: ${pages.length} pages, ${fails.length} problems`);
for (const f of fails) console.log('  FAIL ' + f);
process.exit(fails.length ? 1 : 0);
