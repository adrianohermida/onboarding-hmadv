import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'data-governance/README.md',
  'data-governance/registry/entity-registry.json',
  'data-governance/registry/schema-registry.json',
  'data-governance/contracts/DataContractsCatalog.js',
  'data-governance/validation/SchemaValidator.js',
  'data-governance/validation/TenantValidator.js',
  'data-governance/validation/PermissionValidator.js',
  'data-governance/validation/TypedValidators.js',
  'data-governance/normalizers/CommonNormalizers.js',
  'data-governance/serializers/PayloadSerializers.js',
  'data-governance/transformers/DomainTransformers.js',
  'data-governance/observability/DataObservability.js',
  'data-governance/versioning/schema-versioning.md',
  'data-governance/migrations/migration-governance.md',
  'data-governance/ownership/entity-ownership.md',
  'docs/contracts/README.md',
  'docs/contracts/payloads.md',
  'governance/data/data-governance-checklist.md',
  'governance/data/shell-data-safety.md',
  'domains/README.md'
];

const missing = requiredPaths.filter((entry) => !existsSync(entry));
if (missing.length) {
  console.error('validate:data-governance failed. Missing files:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

const registry = JSON.parse(readFileSync('data-governance/registry/entity-registry.json', 'utf8'));
if (!Array.isArray(registry.entities) || registry.entities.length < 10) {
  console.error('validate:data-governance failed. entity registry is incomplete.');
  process.exit(1);
}

const schemaRegistry = JSON.parse(readFileSync('data-governance/registry/schema-registry.json', 'utf8'));
if (!schemaRegistry?.domains || Object.keys(schemaRegistry.domains).length < 6) {
  console.error('validate:data-governance failed. schema registry is incomplete.');
  process.exit(1);
}

console.log('validate:data-governance passed');
