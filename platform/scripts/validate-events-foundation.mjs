import { existsSync, readFileSync } from 'node:fs';

const required = [
  'events/README.md',
  'events/bus/EnterpriseEventBus.js',
  'events/contracts/EventEnvelope.js',
  'events/contracts/EventValidator.js',
  'events/registry/event-registry.json',
  'events/workflows/WorkflowEngine.js',
  'events/orchestrators/bootstrap.js',
  'events/queues/InMemoryEventQueue.js',
  'events/retries/RetryEngine.js',
  'events/dead-letter/DeadLetterQueue.js',
  'events/telemetry/EventTelemetry.js',
  'events/logs/EventLogger.js',
  'docs/events/README.md',
  'governance/events/event-governance.md'
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error('validate:events failed. Missing files:');
  missing.forEach((path) => console.error(`- ${path}`));
  process.exit(1);
}

const registry = JSON.parse(readFileSync('events/registry/event-registry.json', 'utf8'));
if (!Array.isArray(registry.events) || registry.events.length === 0) {
  console.error('validate:events failed. event registry is empty.');
  process.exit(1);
}

console.log('validate:events passed');
