import { describe, expect, it } from 'vitest';
import { integrationHub } from '../integrations/IntegrationHub.js';
import { listProviders } from '../integrations/registry/ProviderRegistry.js';
import { processWebhook } from '../integrations/webhooks/WebhookEngine.js';

describe('integration hub foundation', () => {
  it('exposes provider registry and snapshot shape', () => {
    const providers = listProviders();
    const snapshot = integrationHub.snapshot();

    expect(providers.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.providers.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.health.global).toBeTruthy();
  });

  it('processes webhook payloads with contract validation', async () => {
    const result = await processWebhook({
      provider: 'autentique',
      event: 'signature.completed',
      tenant_id: 'tenant-int',
      signature: 'sig',
      timestamp: new Date().toISOString(),
      body: { ok: true },
    }, async (payload) => ({ handled: payload.event }));

    expect(result.ok).toBe(true);
    expect(result.result.handled).toBe('signature.completed');
  });
});
