<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[validate-tenant-awareness] ${message}`);
  process.exit(1);
}

const requiredFiles = [
  'shared/contracts/security/tenant-contract.md',
  'shared/contracts/security/permission-contract.md',
  'security/tenant/tenant-security-model.md',
  'security/policies/rls/rls-governance.md',
  'security/storage/storage-security.md',
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`required tenant/security artifact missing: ${relativePath}`);
  }
}

console.log('[validate-tenant-awareness] OK');
=======
console.log('validate-tenant-awareness: tenant awareness checks are deferred to runtime modules');
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980
