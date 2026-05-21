import { describe, expect, it } from 'vitest';
import { consentEngine } from '../compliance-os/consents/ConsentEngine.js';
import { auditabilityEngine } from '../compliance-os/audit/AuditabilityEngine.js';
import { accessGovernanceEngine } from '../compliance-os/access/AccessGovernanceEngine.js';
import { incidentFoundation } from '../compliance-os/incidents/IncidentFoundation.js';
import { complianceOsFoundation } from '../compliance-os/ComplianceOSFoundation.js';

describe('compliance os foundation', () => {
  it('builds compliance snapshot with consent, audit and access controls', () => {
    consentEngine.register({ tenant_id: 'tenant-cmp', actor_id: 'user-1', consent_type: 'lgpd', accepted: true });
    auditabilityEngine.record({ tenant_id: 'tenant-cmp', actor: 'user-1', action: 'document.uploaded', resource: 'document' });
    accessGovernanceEngine.record({ tenant_id: 'tenant-cmp', actor_id: 'user-1', role: 'advogado', resource: 'financial', sensitivity: 'FINANCEIRO', suspicious: false });
    incidentFoundation.register({ tenant_id: 'tenant-cmp', type: 'lgpd_incident', severity: 'high' });

    const snapshot = complianceOsFoundation.snapshot('tenant-cmp');
    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.consents.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.audit.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.access.total).toBeGreaterThanOrEqual(1);
  });

  it('enforces governance requirements for trust-first operations', () => {
    const snapshot = complianceOsFoundation.snapshot('tenant-cmp');
    expect(snapshot.governance.audit_trail_required).toBe(true);
    expect(snapshot.governance.consent_awareness_required).toBe(true);
    expect(snapshot.governance.tenant_awareness_required).toBe(true);
  });
});
