import { describe, expect, it } from 'vitest';
import { caseLifecycleMachine } from '../workflow-engine/state-machines/cases/CaseLifecycleMachine.js';
import { workflowAutomationFoundation } from '../workflow-engine/WorkflowAutomationFoundation.js';
import { workflowTelemetry } from '../workflow-engine/telemetry/WorkflowTelemetry.js';

describe('workflow automation foundation', () => {
  it('supports explicit lifecycle transitions', () => {
    const case_id = `case_test_${Date.now()}`;
    caseLifecycleMachine.start(case_id, { tenant_id: 'tenant-test', actor: 'tester' });
    caseLifecycleMachine.transition(case_id, 'invited', { tenant_id: 'tenant-test', actor: 'tester' });
    caseLifecycleMachine.transition(case_id, 'onboarding_started', { tenant_id: 'tenant-test', actor: 'tester' });

    const current = caseLifecycleMachine.get(case_id);
    expect(current.state).toBe('onboarding_started');
    expect(current.history.length).toBeGreaterThanOrEqual(3);
  });

  it('provides workflow operational snapshot', () => {
    workflowTelemetry.record({ workflow: 'onboarding', throughput: 1, tenant_id: 'tenant-test' });
    const snapshot = workflowAutomationFoundation.snapshot();

    expect(Array.isArray(snapshot.definitions)).toBe(true);
    expect(snapshot.lifecycle.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.telemetry.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.queue.depth).toBeGreaterThanOrEqual(0);
  });
});
