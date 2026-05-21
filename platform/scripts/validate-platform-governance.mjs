import { existsSync, readFileSync } from 'node:fs';

const checks = [
  ['design-system root', 'design-system/README.md'],
  ['design governance checklist', 'governance/design/design-review-checklist.md'],
  ['design system docs', 'docs/design-system/README.md'],
  ['design system tokens bridge', 'design-system/tokens/core.css'],
  ['design system component registry', 'design-system/components/registry.json'],
  ['design system theme foundation', 'design-system/themes/light.css'],
  ['design system responsive foundation', 'design-system/responsive/mobile-first.css'],
  ['design system accessibility foundation', 'design-system/accessibility/accessibility-foundation.md'],
  ['design system component ownership doc', 'docs/design-system/component-ownership.md'],
  ['design system shell governance', 'governance/design/shell-visual-governance.md'],
  ['finops governance', 'governance/finops/finops-governance.md'],
  ['observability governance', 'governance/observability/logging-standards.md'],
  ['integration governance', 'governance/integrations/naming-standards.md'],
  ['workflow governance', 'governance/workflows/module-requirements.md'],
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
const requiredScripts = [
  'bootstrap:dev',
  'validate:env',
  'validate:platform',
  'diagnostics:platform',
  'validate:events',
  'validate:data-governance',
  'validate:finops',
  'validate:observability',
  'validate:integrations',
  'validate:workflows'
];
const missingScripts = requiredScripts.filter((scriptName) => !packageJson.scripts?.[scriptName]);
if (missingScripts.length) {
  console.error('validate:platform failed. Missing package scripts:');
  missingScripts.forEach((scriptName) => console.error(`- ${scriptName}`));
  process.exit(1);
}

console.log('validate:platform passed');
console.log('Governance files and package scripts are present.');
