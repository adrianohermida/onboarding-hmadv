import { describe, expect, it } from 'vitest';
import { createEventEnvelope } from '../events/contracts/EventEnvelope.js';
import { createTracePayload } from '../shared/contracts/observability/TraceContracts.js';

describe('trace contracts foundation', () => {
  it('adds trace identifiers to event envelope', () => {
    const envelope = createEventEnvelope('workflow.failed', { ok: false }, { tenant_id: 'tenant-z' });

    expect(envelope.trace_id).toBeTruthy();
    expect(envelope.span_id).toBeTruthy();
    expect(envelope.request_id).toBeTruthy();
    expect(envelope.correlation_id).toBeTruthy();
  });

  it('builds standard trace payload with tenant and workflow', () => {
    const payload = createTracePayload({ tenant_id: 'tenant-z', workflow_id: 'wf-1' });

    expect(payload.tenant_id).toBe('tenant-z');
    expect(payload.workflow_id).toBe('wf-1');
    expect(payload.trace_id).toBeTruthy();
  });
});
