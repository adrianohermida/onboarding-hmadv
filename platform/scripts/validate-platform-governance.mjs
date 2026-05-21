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
