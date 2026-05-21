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
  'design-system/README.md',
  'governance/design/design-review-checklist.md',
  'docs/design-system/README.md',
  '.github/workflows/static.yml',
  '.github/workflows/supabase-deploy.yml',
];

for (const relativePath of requiredArtifacts) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`required platform artifact missing: ${relativePath}`);
  }
}

console.log('[validate-platform-governance] OK');
