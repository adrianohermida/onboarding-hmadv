import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const vitest = path.join(root, 'node_modules', 'vitest', 'vitest.mjs');

const batches = [
  [
    'tests/analytics-contracts-foundation.test.js',
    'tests/billing-lifecycle-foundation.test.js',
    'tests/client-experience-contracts-foundation.test.js',
    'tests/client-experience-foundation.test.js',
    'tests/compliance-contracts-foundation.test.js',
    'tests/data-governance-foundation.test.js',
  ],
  [
    'tests/document-intelligence-foundation.test.js',
    'tests/event-bus-foundation.test.js',
    'tests/financial-contracts-foundation.test.js',
    'tests/financial-intelligence-foundation.test.js',
    'tests/finops-foundation.test.js',
    'tests/integration-security-foundation.test.js',
  ],
  [
    'tests/integrations-foundation.test.js',
    'tests/knowledge-contracts-foundation.test.js',
    'tests/legal-operations-contracts-foundation.test.js',
    'tests/legal-operations-foundation.test.js',
    'tests/observability-foundation.test.js',
    'tests/trace-contracts.test.js',
  ],
  [
    'tests/navigation-contract.test.js',
    'tests/phase3-contracts.test.js',
    'tests/shell-routes-smoke.test.js',
    'tests/shell-runtime-isolation.test.js',
  ],
];

for (const batch of batches) {
  const result = spawnSync(process.execPath, [vitest, 'run', ...batch], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
