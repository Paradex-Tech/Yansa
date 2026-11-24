// node docs/rework/tools/check-dead-css.mjs [-v] : class/id names used in css/style.css and css/m/*.css that appear in no
// html or js file (substring match, so classes built in JS strings still count as used). Lists them with their first line;
// -v also prints unused images under images/ (nothing in html, css, js, manifest or worker references the file name).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const css = ['css/style.css', ...readdirSync(join(root, 'css', 'm')).map((f) => 'css/m/' + f)];
const corpusFiles = [...readdirSync(root).filter((f) => f.endsWith('.html')), ...walk(join(root, 'js')).map((p) => relative(root, p))];
const corpus = corpusFiles.map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
const report = {};
for (const file of css) {
  const src = readFileSync(join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  let line = 1, start = 0, depth = 0;
  const preludeAt = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\n') line++;
    if (c === '{') { const pre = src.slice(start, i); if (!/^\s*@/.test(pre)) preludeAt.push([pre.split(';').pop(), line]); start = i + 1; }
    else if (c === '}' || c === ';') start = i + 1;
  }
  for (const [pre, ln] of preludeAt) {
    const sel = pre.split(';').pop();
    for (const m of sel.matchAll(/[.#]([A-Za-z_][\w-]*)/g)) {
      if (/^\d/.test(m[1])) continue;
      if (!corpus.includes(m[1])) ((report[m[1]] ||= []).push(`${file}:${ln}`));
    }
  }
}
const names = Object.keys(report).sort();
console.log(`check-dead-css: ${names.length} class/id names with no html/js reference`);
for (const n of names) console.log(`  ${n}  (${report[n].length}x, first ${report[n][0]})`);
if (process.argv.includes('-v')) {
  const all = readdirSync(root).filter((f) => /\.(html|webmanifest|jsonc|txt|xml)$/.test(f));
  const text = [...all, ...walk(join(root, 'css')).map((p) => relative(root, p)), ...walk(join(root, 'js')).map((p) => relative(root, p)), ...walk(join(root, 'worker')).map((p) => relative(root, p))]
    .map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  const unused = walk(join(root, 'images')).map((p) => relative(root, p).split(sep).join('/')).filter((p) => !text.includes(p.split('/').pop()));
  console.log(`unused images: ${unused.length}`);
  for (const u of unused) console.log('  ' + u);
}
