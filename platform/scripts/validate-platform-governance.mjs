import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[validate-platform-governance] ${message}`);
  process.exit(1);
}

// Verify key governance files exist
const requiredFiles = [
  'ARCHITECTURE.md',
  'package.json',
  '.github/workflows/deploy-storybook.yml',
];

const missing = requiredFiles.filter(f => !fs.existsSync(path.join(root, f)));
if (missing.length) fail(`missing governance files: ${missing.join(', ')}`);

// Verify no secrets committed
const sensitivePatterns = [/SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/, /sk-[a-zA-Z0-9]{20,}/];
const scanFiles = ['package.json', 'ARCHITECTURE.md'];

for (const file of scanFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) fail(`potential secret detected in ${file}`);
  }
}

console.log('[validate-platform-governance] OK');
