// node docs/rework/tools/check-site.mjs : _redirects, sitemap.xml, robots.txt, #services forward, tone grep, 404 page.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const rd = (f) => readFileSync(join(root, f), 'utf8');
const fails = [];
const f = (m) => fails.push(m);
// redirects
const red = rd('_redirects').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
for (const from of ['/solution', '/solution.html', '/pq-solved', '/pq-solved.html']) {
  const r = red.find((x) => x[0] === from);
  if (!r || r[1] !== '/solutions' || r[2] !== '301') f(`_redirects: ${from} must 301 to /solutions`);
}
for (const from of ['/AGENTS.md', '/backend/*', '/docs/*', '/_headers', '/_redirects']) {
  const r = red.find((x) => x[0] === from);
  if (!r || r[1] !== '/404') f(`_redirects: ${from} must go to /404`);
}
if (!/location\.hash === '#services'\) location\.replace\('services\.html'\)/.test(rd('solutions.html'))) f('solutions.html: #services forward missing');
// sitemap
const pub = ['index', 'about', 'solutions', 'services', 'know-your-loads', 'yanq', 'contact', 'privacy-policy', 'terms'];
const want = pub.map((p) => 'https://yansa.in/' + (p === 'index' ? '' : p)).sort();
const got = [...rd('sitemap.xml').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]).sort();
if (JSON.stringify(got) !== JSON.stringify(want)) f(`sitemap.xml mismatch: got ${got.join(' ')}`);
for (const p of pub) if (!existsSync(join(root, p + '.html'))) f(`public page missing: ${p}.html`);
if (!/^Sitemap: https:\/\/yansa\.in\/sitemap\.xml$/m.test(rd('robots.txt'))) f('robots.txt: Sitemap line missing');
// 404
const n = rd('404.html');
if (!/class="navbar"/.test(n) || !/class="footer"/.test(n)) f('404.html: nav/footer missing');
// tone: copy only (html text, and js without comments)
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const tone = /command|mandate|PQ Solved/i;
for (const file of readdirSync(root).filter((x) => x.endsWith('.html'))) {
  const t = rd(file).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const l of t.split('\n')) if (tone.test(l)) f(`tone: ${file}: ${l.trim().slice(0, 80)}`);
}
for (const file of [...readdirSync(join(root, 'js')).filter((x) => x.endsWith('.js')).map((x) => 'js/' + x), ...readdirSync(join(root, 'js', 'm')).map((x) => 'js/m/' + x)])
  for (const l of strip(rd(file)).split('\n')) if (tone.test(l)) f(`tone: ${file}: ${l.trim().slice(0, 80)}`);
console.log(`check-site: ${fails.length} problems`);
for (const x of fails) console.log('  FAIL ' + x);
process.exit(fails.length ? 1 : 0);
