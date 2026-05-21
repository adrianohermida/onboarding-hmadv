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

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const summary = {
  packageName: packageJson.name,
  scriptCount: Object.keys(packageJson.scripts || {}).length,
  hasDesignSystem: fs.existsSync(path.join(root, 'design-system/README.md')),
  hasDesignDocs: fs.existsSync(path.join(root, 'docs/design-system/README.md')),
  hasDesignGovernance: fs.existsSync(path.join(root, 'governance/design/design-review-checklist.md')),
};

console.log('[diagnostics] platform engineering artifacts look healthy');
console.log('diagnostics:platform summary');
console.log(JSON.stringify(summary, null, 2));
