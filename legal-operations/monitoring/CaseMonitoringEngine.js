export class CaseMonitoringEngine {
  evaluate({ cases = [], tasks = [], negotiations = [], deadlines = [] } = {}) {
    const critical_cases = cases.filter((entry) => Number(entry.risk_score) >= 80 || Number(entry.urgency_score) >= 80).length;
    const onboarding_stalled = cases.filter((entry) => entry.onboarding_state === 'stalled').length;
    const negotiation_stalled = negotiations.filter((entry) => entry.status === 'stalled').length;
    const pending_documents = cases.filter((entry) => entry.documents_state === 'pending').length;
    const pending_agreements = cases.filter((entry) => entry.status === 'agreement_pending').length;
    const overdue_deadlines = deadlines.filter((entry) => entry.status === 'overdue').length;

    return {
      critical_cases,
      onboarding_stalled,
      negotiation_stalled,
      pending_documents,
      pending_agreements,
      overdue_deadlines,
      open_tasks: tasks.filter((entry) => entry.status !== 'completed').length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const caseMonitoringEngine = new CaseMonitoringEngine();
