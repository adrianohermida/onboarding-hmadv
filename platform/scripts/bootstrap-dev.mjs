<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'platform',
  'shell',
  'modules',
  'pages',
  'services',
=======
import { existsSync } from 'node:fs';

const required = [
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980
  'package.json',
  'styles/main.css',
  'design-system/README.md',
  'governance/design/design-review-checklist.md'
];
<<<<<<< HEAD
const missing = required.filter(dir => !fs.existsSync(path.join(root, dir)));

if (missing.length) {
  console.error(`[bootstrap-dev] missing required workspace paths: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[bootstrap-dev] workspace foundation OK');
console.log('[bootstrap-dev] next: npm ci && npm test');
=======

const missing = required.filter((entry) => !existsSync(entry));

if (missing.length) {
  console.error('bootstrap:dev failed. Missing required paths:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log('bootstrap:dev passed');
console.log('Workspace foundation is ready for local development.');
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980
