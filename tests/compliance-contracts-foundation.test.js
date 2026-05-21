import { describe, expect, it } from 'vitest';
import { normalizeConsentPayload } from '../shared/contracts/compliance/ConsentContracts.js';
import { normalizeAuditPayload } from '../shared/contracts/compliance/AuditContracts.js';
import { normalizeRiskPayload } from '../shared/contracts/compliance/RiskContracts.js';
import { normalizeRetentionPayload } from '../shared/contracts/compliance/RetentionContracts.js';
import { normalizePrivacyPayload } from '../shared/contracts/compliance/PrivacyContracts.js';

describe('compliance contracts', () => {
  it('normalizes consent and audit payloads', () => {
    const consent = normalizeConsentPayload({ tenant_id: 'tenant-cmp', consent_type: 'lgpd' });
    const audit = normalizeAuditPayload({ action: 'resource.accessed', resource: 'document' });

    expect(consent.tenant_id).toBe('tenant-cmp');
    expect(audit.resource).toBe('document');
  });

  it('normalizes risk, retention and privacy payloads', () => {
    const risk = normalizeRiskPayload({ lgpd_risk: 70, leakage_risk: 40 });
    const retention = normalizeRetentionPayload({ retention_days: 3650, legal_hold: true });
    const privacy = normalizePrivacyPayload({ tenant_isolation: true, secure_access: true });

    expect(risk.lgpd_risk).toBe(70);
    expect(retention.legal_hold).toBe(true);
    expect(privacy.tenant_isolation).toBe(true);
  });
});
