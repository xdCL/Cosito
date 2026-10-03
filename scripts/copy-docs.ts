import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('public', { recursive: true });
for (const name of ['PRIVACY.md', 'LICENSE', 'FONT-LICENSES.md'])
  copyFileSync(name, `public/${name}`);
