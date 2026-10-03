import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
const index = readFileSync('dist/index.html', 'utf8');
const base = process.env.COSITO_BASE || '/Cosito/';
if (!index.includes(`${base}assets/`) || index.includes('%VITE_'))
  throw new Error('Base path o identidad incorrecta.');
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
if (manifest.scope !== base || manifest.start_url !== base)
  throw new Error('Scope PWA incorrecto.');
const sw = readFileSync('dist/sw.js', 'utf8');
for (const required of ['woff2', 'pdf.worker', 'generate-pdf', 'theme-init.js', 'icon-512.png'])
  if (!sw.includes(required)) throw new Error(`Asset sin precache: ${required}`);
const entry = readdirSync('dist/assets').filter((name) => /^index-.*\.js$/.test(name));
const size = entry.reduce(
  (n, name) => n + gzipSync(readFileSync(join('dist/assets', name))).length,
  0,
);
if (size > 200_000) throw new Error(`JS inicial demasiado grande: ${size}`);
console.log(
  `Build: base ${base}; PWA y assets offline verificados; JS inicial ${(size / 1024).toFixed(1)} KiB gzip.`,
);
