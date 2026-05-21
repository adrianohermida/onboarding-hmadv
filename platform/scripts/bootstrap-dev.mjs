import { existsSync } from 'node:fs';

const required = [
  'package.json',
  'styles/main.css',
  'design-system/README.md',
  'governance/design/design-review-checklist.md'
];

const missing = required.filter((entry) => !existsSync(entry));

if (missing.length) {
  console.error('bootstrap:dev failed. Missing required paths:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log('bootstrap:dev passed');
console.log('Workspace foundation is ready for local development.');
