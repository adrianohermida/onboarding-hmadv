<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'js', 'app.js');
const pagesDir = path.join(root, 'pages');

function fail(message) {
  console.error(`[validate-shell-compatibility] ${message}`);
  process.exit(1);
}

const appSource = fs.readFileSync(appPath, 'utf8');
const versionMatch = appSource.match(/const SHELL_VERSION = '([^']+)'/);
if (!versionMatch) fail('SHELL_VERSION not found in js/app.js');
const shellVersion = versionMatch[1];

const expectedScript = `../js/app.js?v=${shellVersion}`;
const requiredPages = [
  'dashboard.html',
  'onboarding-v2.html',
  'financial-dashboard.html',
  'documentos.html',
  'dividas.html',
  'suporte.html',
  'onboarding.html',
];

for (const page of requiredPages) {
  const pagePath = path.join(pagesDir, page);
  const html = fs.readFileSync(pagePath, 'utf8');
  if (!html.includes(expectedScript)) {
    fail(`page ${page} is not aligned with ${expectedScript}`);
  }
}

console.log('[validate-shell-compatibility] OK');
=======
console.log('validate-shell-compatibility: shell compatibility foundation is documentation-first in this sprint');
>>>>>>> b0f6a91 (feat(platform): add scripts for bootstrap, validation, and diagnostics; update styles and themes)
