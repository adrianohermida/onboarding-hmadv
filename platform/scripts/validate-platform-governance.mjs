<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[validate-platform-governance] ${message}`);
  process.exit(1);
}

const requiredArtifacts = [
  'platform/environments/README.md',
  'platform/releases/release-governance.md',
  'platform/rollback/rollback-strategy.md',
  'platform/health/health-engine.md',
  'platform/telemetry/telemetry-foundation.md',
  'platform/logging/logging-foundation.md',
  'platform/feature-flags/feature-flags-governance.md',
  'docs/platform/README.md',
];

for (const relativePath of requiredArtifacts) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`required platform artifact missing: ${relativePath}`);
  }
}

console.log('[validate-platform-governance] OK');
=======
import { existsSync, readFileSync } from 'node:fs';

const checks = [
  ['design-system root', 'design-system/README.md'],
  ['design governance checklist', 'governance/design/design-review-checklist.md'],
  ['design system docs', 'docs/design-system/README.md'],
  ['platform readme', 'platform/README.md'],
  ['workflow static deploy', '.github/workflows/static.yml'],
  ['workflow supabase deploy', '.github/workflows/supabase-deploy.yml']
];

const missing = checks.filter(([, filePath]) => !existsSync(filePath));
if (missing.length) {
  console.error('validate:platform failed. Missing required governance files:');
  missing.forEach(([label, filePath]) => console.error(`- ${label}: ${filePath}`));
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const requiredScripts = ['bootstrap:dev', 'validate:env', 'validate:platform', 'diagnostics:platform'];
const missingScripts = requiredScripts.filter((scriptName) => !packageJson.scripts?.[scriptName]);
if (missingScripts.length) {
  console.error('validate:platform failed. Missing package scripts:');
  missingScripts.forEach((scriptName) => console.error(`- ${scriptName}`));
  process.exit(1);
}

console.log('validate:platform passed');
console.log('Governance files and package scripts are present.');
>>>>>>> b0f6a91 (feat(platform): add scripts for bootstrap, validation, and diagnostics; update styles and themes)
