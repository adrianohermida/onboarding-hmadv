import { describe, expect, it } from 'vitest';
import { normalizeCasePayload } from '../shared/contracts/legal-operations/CaseContracts.js';
import { normalizeTaskPayload } from '../shared/contracts/legal-operations/TaskContracts.js';
import { normalizeNegotiationPayload } from '../shared/contracts/legal-operations/NegotiationContracts.js';
import { normalizeSlaPayload } from '../shared/contracts/legal-operations/SlaContracts.js';
import { normalizeTimelinePayload } from '../shared/contracts/legal-operations/TimelineContracts.js';

describe('legal operations contracts', () => {
  it('normalizes legal case and task payloads', () => {
    const casePayload = normalizeCasePayload({ tenant_id: 'tenant-lo', status: 'lead' });
    const taskPayload = normalizeTaskPayload({ tenant_id: 'tenant-lo', type: 'analise_juridica' });

    expect(casePayload.tenant_id).toBe('tenant-lo');
    expect(taskPayload.type).toBe('analise_juridica');
  });

  it('normalizes negotiation, sla and timeline payloads', () => {
    const negotiationPayload = normalizeNegotiationPayload({ discount: 20 });
    const slaPayload = normalizeSlaPayload({ stage: 'negotiation', elapsed_hours: 5 });
    const timelinePayload = normalizeTimelinePayload({ type: 'case.transitioned' });

    expect(negotiationPayload.discount).toBe(20);
    expect(slaPayload.stage).toBe('negotiation');
    expect(timelinePayload.type).toBe('case.transitioned');
  });
});
