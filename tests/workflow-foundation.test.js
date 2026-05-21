import { describe, expect, it } from 'vitest';
import { caseLifecycleMachine } from '../workflow-engine/state-machines/cases/CaseLifecycleMachine.js';
import { workflowTelemetry } from '../workflow-engine/telemetry/WorkflowTelemetry.js';
import { listWorkflowDefinitions } from '../workflow-engine/definitions/WorkflowDefinitions.js';

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

  it('provides workflow definitions and telemetry records', () => {
    workflowTelemetry.record({ workflow: 'onboarding', throughput: 1, tenant_id: 'tenant-test' });
    const definitions = listWorkflowDefinitions();
    const snapshot = workflowTelemetry.snapshot();

    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.throughput).toBeGreaterThanOrEqual(1);
  });
});
