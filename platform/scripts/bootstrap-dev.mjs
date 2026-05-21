<<<<<<< HEAD
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
=======
import { existsSync } from 'node:fs';

const required = [
  'package.json',
  'styles/main.css',
  'design-system/README.md',
  'governance/design/design-review-checklist.md'
];

const missing = required.filter((entry) => !existsSync(entry));

if (missing.length) {
  console.error('bootstrap:dev failed. Missing required paths:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log('bootstrap:dev passed');
console.log('Workspace foundation is ready for local development.');
>>>>>>> b0f6a91 (feat(platform): add scripts for bootstrap, validation, and diagnostics; update styles and themes)
