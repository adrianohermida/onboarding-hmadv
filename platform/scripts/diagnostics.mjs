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
