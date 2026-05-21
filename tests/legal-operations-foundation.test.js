import { describe, expect, it } from 'vitest';
import { caseEngine } from '../legal-operations/cases/CaseEngine.js';
import { taskEngine } from '../legal-operations/tasks/TaskEngine.js';
import { legalSlaEngine } from '../legal-operations/sla/LegalSlaEngine.js';
import { legalOperationsFoundation } from '../legal-operations/LegalOperationsFoundation.js';

describe('legal operations foundation', () => {
  it('creates and transitions case lifecycle with ownership', () => {
    const c = caseEngine.create({
      tenant_id: 'tenant-lo',
      client_id: 'cl-1',
      lawyer_id: 'law-1',
      operator_id: 'op-1',
      status: 'onboarding',
      risk_score: 35,
      urgency_score: 40,
    });

    const transitioned = caseEngine.transition(c.case_id, 'financial_analysis', 'law-1');
    expect(transitioned.status).toBe('financial_analysis');
  });

  it('exposes timeline, sla and monitoring snapshot', () => {
    taskEngine.create({ tenant_id: 'tenant-lo', case_id: 'case-x', status: 'open' });
    legalSlaEngine.track({ tenant_id: 'tenant-lo', case_id: 'case-x', stage: 'review', elapsed_hours: 80, target_hours: 48, status: 'overdue' });

    const snapshot = legalOperationsFoundation.snapshot('tenant-lo');
    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.sla.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.monitoring.open_tasks).toBeGreaterThanOrEqual(1);
  });
});
