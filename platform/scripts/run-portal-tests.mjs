import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const vitest = path.join(root, 'node_modules', 'vitest', 'vitest.mjs');

const batches = [
  [
    'tests/trace-contracts.test.js',
    'tests/advogado-portal-contract.test.js',
    'tests/agenda-tarefas-operational-contract.test.js',
    'tests/case-flow-contract.test.js',
    'tests/cliente-portal-contract.test.js',
    'tests/clients-visibility-invite-contract.test.js',
  ],
  [
    'tests/crm-conversational-messaging-contract.test.js',
    'tests/documentos-enterprise-contract.test.js',
    'tests/financial-plan-operational-contract.test.js',
    'tests/freshdesk-support-contract.test.js',
    'tests/judiciario-rls-crud-contract.test.js',
    'tests/judiciario-schema-coverage-contract.test.js',
  ],
  [
    'tests/legal-notifications-contract.test.js',
    'tests/mensagens-timeline-contract.test.js',
    'tests/mobile-ux-checklist-contract.test.js',
    'tests/navigation-contract.test.js',
    'tests/operational-crud-contract.test.js',
    'tests/performance-mobile-contract.test.js',
    'tests/phase3-contracts.test.js',
    'tests/shell-operational-contract.test.js',
    'tests/shell-routes-smoke.test.js',
    'tests/shell-runtime-isolation.test.js',
    'tests/supabase-rls-multitenancy-contract.test.js',
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
