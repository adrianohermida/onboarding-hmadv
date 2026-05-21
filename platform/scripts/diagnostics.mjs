<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  'platform/environments/README.md',
  'platform/health/health-engine.md',
  'platform/telemetry/telemetry-foundation.md',
  'platform/logging/logging-foundation.md',
  'docs/platform/README.md',
];

const missing = checks.filter(item => !fs.existsSync(path.join(root, item)));

if (missing.length) {
  console.error(`[diagnostics] missing platform artifacts: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[diagnostics] platform engineering artifacts look healthy');
=======
import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const summary = {
  packageName: packageJson.name,
  scriptCount: Object.keys(packageJson.scripts || {}).length,
  hasDesignSystem: existsSync('design-system/README.md'),
  hasDesignDocs: existsSync('docs/design-system/README.md'),
  hasDesignGovernance: existsSync('governance/design/design-review-checklist.md')
};

console.log('diagnostics:platform summary');
console.log(JSON.stringify(summary, null, 2));
>>>>>>> b0f6a91 (feat(platform): add scripts for bootstrap, validation, and diagnostics; update styles and themes)
