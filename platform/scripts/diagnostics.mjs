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
