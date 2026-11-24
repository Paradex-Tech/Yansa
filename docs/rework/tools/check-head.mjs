// node docs/rework/tools/check-head.mjs : per-page <head> (unique title + description, canonical and og:url extensionless
// and matching the page, og:image present and existing, JSON-LD parses and holds no retired URL). 404 is noindex.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
const meta = (s, re) => (s.match(re) || [])[1];
const titles = {}, descs = {};
const fails = [];
for (const p of pages) {
  const s = readFileSync(join(root, p), 'utf8');
  const head = s.slice(0, s.indexOf('</head>'));
  const title = meta(head, /<title>([^<]*)<\/title>/);
  const desc = meta(head, /<meta name="description" content="([^"]*)"/);
  const canon = meta(head, /<link rel="canonical" href="([^"]*)"/);
  const ogurl = meta(head, /<meta property="og:url" content="([^"]*)"/);
  const ogimg = meta(head, /<meta property="og:image" content="([^"]*)"/);
  const f = (m) => fails.push(`${p}: ${m}`);
  if (!title) f('no title'); else (titles[title] ||= []).push(p);
  if (!desc) f('no description'); else (descs[desc] ||= []).push(p);
  if (p !== '404.html') {
    const slug = p === 'index.html' ? '' : p.replace(/\.html$/, '');
    const want = 'https://yansa.in/' + slug;
    if (canon !== want) f(`canonical ${canon}, want ${want}`);
    if (ogurl !== want) f(`og:url ${ogurl}, want ${want}`);
    if (!ogimg) f('no og:image');
    else if (!ogimg.startsWith('https://yansa.in/') || !existsSync(join(root, ogimg.replace('https://yansa.in/', '')))) f(`og:image not a local file: ${ogimg}`);
    if (!meta(head, /<meta property="og:title" content="([^"]*)"/)) f('no og:title');
    if (!meta(head, /<meta property="og:description" content="([^"]*)"/)) f('no og:description');
  } else if (!/noindex/.test(head)) f('404 should be noindex');
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
      if (/yansa\.in\/(solution|pq-solved)\b|\.html/.test(m[1].replace(/\s+/g, ''))) f('JSON-LD has a retired or .html URL');
    } catch (e) { f('JSON-LD invalid: ' + e.message); }
  }
}
for (const [k, v] of Object.entries(titles)) if (v.length > 1) fails.push(`duplicate title "${k}": ${v}`);
for (const [k, v] of Object.entries(descs)) if (v.length > 1) fails.push(`duplicate description: ${v}`);
console.log(`check-head: ${pages.length} pages, ${fails.length} problems`);
for (const f of fails) console.log('  FAIL ' + f);
process.exit(fails.length ? 1 : 0);
