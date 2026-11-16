import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [join(root, 'server.js')];
function visit(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, item.name);
    if (item.isDirectory()) visit(file);
    else if (file.endsWith('.js')) files.push(file);
  }
}
for (const folder of ['src', 'scripts', 'tests']) visit(join(root, folder));
let errors = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { console.error(file, result.stderr); errors++; }
  const contents = readFileSync(file, 'utf8');
  if (/\bmodule\.exports\b|\brequire\s*\(/.test(contents)) {
    console.error('CommonJS statement detected:', file); errors++;
  }
  const relativeImports = contents.matchAll(/\b(?:from\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g);
  for (const match of relativeImports) {
    const candidate = resolve(dirname(file), match[1]);
    try { readFileSync(candidate); } catch { console.error('Unresolved local import:', file, match[1]); errors++; }
  }
}
console.log(`Checked ${files.length} backend JavaScript files (ESM syntax + local imports).`);
if (errors) process.exitCode = 1;
