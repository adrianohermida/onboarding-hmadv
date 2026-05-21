export class AiObservability {
  evaluate({ telemetry = [], runtime = [] } = {}) {
    return {
      hallucination_risk: telemetry.filter((entry) => String(entry.event || '').includes('hallucination')).length,
      workflow_misuse: telemetry.filter((entry) => String(entry.event || '').includes('workflow.misuse')).length,
      unsafe_actions: telemetry.filter((entry) => String(entry.status || '') === 'unsafe').length,
      tenant_violations: runtime.filter((entry) => entry.tenant_quota_ok === false).length,
      prompt_failures: telemetry.filter((entry) => String(entry.event || '').includes('prompt.failure')).length,
      degraded_responses: telemetry.filter((entry) => (entry.latency_ms || 0) > 4000).length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const aiObservability = new AiObservability();
