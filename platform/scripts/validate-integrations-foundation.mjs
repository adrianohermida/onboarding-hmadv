import { existsSync, readFileSync } from 'node:fs';

const required = [
  'integrations/README.md',
  'integrations/IntegrationHub.js',
  'integrations/ShellIntegrationVisibility.js',
  'integrations/registry/provider-registry.json',
  'integrations/registry/ProviderRegistry.js',
  'integrations/contracts/RequestContracts.js',
  'integrations/contracts/ResponseContracts.js',
  'integrations/contracts/WebhookContracts.js',
  'integrations/contracts/RetryContracts.js',
  'integrations/contracts/SyncContracts.js',
  'integrations/adapters/FreshdeskAdapter.js',
  'integrations/adapters/ResendAdapter.js',
  'integrations/adapters/AutentiqueAdapter.js',
  'integrations/providers/freshdesk/FreshdeskIntegrationEngine.js',
  'integrations/providers/resend/ResendIntegrationEngine.js',
  'integrations/providers/resend/templates/EmailTemplates.js',
  'integrations/providers/autentique/AutentiqueIntegrationEngine.js',
  'integrations/providers/future/FutureProviderFoundation.js',
  'integrations/webhooks/WebhookEngine.js',
  'integrations/security/WebhookSecurity.js',
  'integrations/queues/IntegrationQueue.js',
  'integrations/retries/IntegrationRetryEngine.js',
  'integrations/telemetry/IntegrationTelemetry.js',
  'integrations/health/ProviderHealthEngine.js',
  'integrations/logs/IntegrationLogger.js',
  'integrations/sync/SyncEngine.js',
  'integrations/transforms/ProviderTransforms.js',
  'integrations/orchestrators/IntegrationOrchestrators.js',
  'integrations/workflows/DocumentWorkflowIntegrations.js',
  'shared/contracts/integrations/IntegrationContracts.js',
  'docs/integrations/README.md',
  'docs/integrations/providers.md',
  'docs/integrations/adapters.md',
  'docs/integrations/contracts.md',
  'docs/integrations/retries.md',
  'docs/integrations/webhooks.md',
  'docs/integrations/workflows.md',
  'docs/integrations/telemetry.md',
  'governance/integrations/naming-standards.md',
  'governance/integrations/retry-standards.md',
  'governance/integrations/webhook-standards.md',
  'governance/integrations/observability-standards.md',
  'governance/integrations/tenant-safety.md',
  'governance/integrations/ai-integration-governance.md',
  'admin/integrations/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:integrations failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

const registry = JSON.parse(readFileSync('integrations/registry/provider-registry.json', 'utf8'));
const requiredProviders = [
  'freshdesk',
  'resend',
  'autentique',
  'supabase',
  'youtube_embeds',
  'ocr_provider_future',
  'whatsapp_provider_future',
  'stripe_future',
  'hubspot_future',
  'google_drive_future',
];
const names = new Set((registry.providers || []).map((item) => item.name));
const missingProviders = requiredProviders.filter((name) => !names.has(name));
if (missingProviders.length) {
  console.error('validate:integrations failed. Missing providers in registry:');
  missingProviders.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

console.log('validate:integrations passed');
