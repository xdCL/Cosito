import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export function productionFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? productionFiles(join(root, entry.name)) : [join(root, entry.name)],
  );
}
const forbidden =
  /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b|https?:\/\/(?!github\.com\/xdCL\/Cosito)/;
for (const file of productionFiles('src')) {
  if (/\.(ts|tsx|js)$/.test(file) && forbidden.test(readFileSync(file, 'utf8')))
    throw new Error(`Uso de red no autorizado: ${file}`);
}
console.log('Privacidad: sin APIs de upload ni conexiones externas en src.');
