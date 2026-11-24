// node docs/rework/tools/links.mjs : static scan of every public html. Exit 1 on any failure.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const redirects = existsSync(join(root, '_redirects'))
  ? readFileSync(join(root, '_redirects'), 'utf8').split('\n').map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 2 && p[0].startsWith('/'))
  : [];
const html = Object.fromEntries(pages.map((p) => [p, readFileSync(join(root, p), 'utf8')]));
const ids = (src) => new Set([...src.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
const idCache = {};
const fails = [];
const fail = (p, m) => fails.push(`${p}: ${m}`);
let checked = 0;

const redirected = (path) => redirects.some(([from]) => from === path || (from.endsWith('/*') && path.startsWith(from.slice(0, -1))));

for (const [p, src] of Object.entries(html)) {
  const refs = [...src.matchAll(/\s(?:href|src)\s*=\s*["']([^"']*)["']/g)].map((m) => m[1]);
  for (const r0 of refs) {
    if (!r0 || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(r0)) continue;
    checked++;
    let [path, frag] = r0.split('#');
    path = path.split('?')[0];
    if (/(^|\/)(solution\.html|pq-solved(\.html)?)$/.test(path)) fail(p, `link to retired page ${r0}`);
    let target = p;
    if (path !== '') {
      let rel = path.replace(/^\//, '').replace(/^\.\//, '');
      if (rel === '') rel = 'index.html';
      const abs = join(root, rel);
      if (existsSync(abs) && statSync(abs).isDirectory()) {
        if (!existsSync(join(abs, 'index.html'))) fail(p, `dir without index ${r0}`);
        target = (rel.replace(/\/$/, '') + '/index.html');
      } else if (existsSync(abs)) target = rel;
      else if (redirected('/' + rel) || redirected('/' + rel.replace(/\.html$/, ''))) continue;
      else { fail(p, `missing file ${r0}`); continue; }
    }
    if (frag) {
      if (!target.endsWith('.html') || !html[target]) continue;
      const set = (idCache[target] ||= ids(html[target]));
      if (!set.has(frag)) fail(p, `missing anchor #${frag} on ${target} (from ${r0})`);
    }
  }
  for (const m of src.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0];
    if (!/\swidth\s*=/.test(t) || !/\sheight\s*=/.test(t)) fail(p, `img without width/height: ${t.slice(0, 80)}`);
    if (!/\salt\s*=/.test(t)) fail(p, `img without alt: ${t.slice(0, 80)}`);
  }
  // absolute URLs (canonical, OG, JSON-LD) must not point at retired pages either
  if (/yansa\.in\/(solution|pq-solved)\b/.test(src)) fail(p, 'absolute URL to retired page');
}
for (const r of ['solution.html', 'pq-solved.html']) if (existsSync(join(root, r))) fail(r, 'retired page file still exists');
console.log(`links.mjs: ${pages.length} pages, ${checked} internal refs checked, ${fails.length} problems`);
for (const f of fails) console.log('  FAIL ' + f);
process.exit(fails.length ? 1 : 0);
