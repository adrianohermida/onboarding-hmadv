import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = ['platform', 'shell', 'modules', 'pages', 'services'];
const missing = required.filter(dir => !fs.existsSync(path.join(root, dir)));

if (missing.length) {
  console.error(`[bootstrap-dev] missing required directories: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[bootstrap-dev] workspace foundation OK');
console.log('[bootstrap-dev] next: npm ci && npm test');
