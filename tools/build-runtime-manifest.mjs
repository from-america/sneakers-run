import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.stringify(JSON.parse(await readFile(path.join(root, 'assets/runtime/sprites.json'), 'utf8')));
await writeFile(
  path.join(root, 'game/runtime-manifest.js'),
  `// Generated from assets/runtime/sprites.json for direct file:// and offline editor use.\nexport const RUNTIME_MANIFEST = ${manifest};`,
);
console.log('Runtime manifest rebuilt.');
