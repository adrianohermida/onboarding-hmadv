import { describe, expect, it } from 'vitest';
import { validateWebhookSecurity } from '../integrations/security/WebhookSecurity.js';
import { requiredSecretsForProvider, isSecretAllowed } from '../integrations/security/secrets/SecretGovernance.js';

describe('integration security foundation', () => {
  it('validates webhook security with signature, timestamp and replay protections', () => {
    const timestamp = Date.now();
    const first = validateWebhookSecurity({
      provider: 'autentique',
      tenant_id: 'tenant-sec',
      signature: 'abc123',
      expectedSignature: 'abc123',
      timestamp,
    });

    const second = validateWebhookSecurity({
      provider: 'autentique',
      tenant_id: 'tenant-sec',
      signature: 'abc123',
      expectedSignature: 'abc123',
      timestamp,
    });

    expect(first.valid).toBe(true);
    expect(second.valid).toBe(false);
    expect(second.reason).toBe('replay_detected');
  });

  it('keeps provider secret mapping explicit and controlled', () => {
    const secrets = requiredSecretsForProvider('freshdesk');
    expect(secrets.length).toBeGreaterThan(0);
    expect(isSecretAllowed('freshdesk', 'FRESHDESK_API_KEY')).toBe(true);
    expect(isSecretAllowed('freshdesk', 'UNSAFE_SECRET')).toBe(false);
  });
});
