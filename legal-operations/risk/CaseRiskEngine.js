export class CaseRiskEngine {
  evaluateCase(caseItem = {}) {
    const risk = Number(caseItem.risk_score) || 0;
    const urgency = Number(caseItem.urgency_score) || 0;
    const abandonment = caseItem.onboarding_state === 'stalled' ? 1 : 0;
    const documental = caseItem.documents_state === 'pending' ? 1 : 0;
    const financial = caseItem.financial_state === 'critical' ? 1 : 0;

    return {
      risk,
      urgency,
      abandonment,
      documental,
      financial,
      critical: risk >= 80 || urgency >= 80 || abandonment > 0,
    };
  }

  snapshot(cases = []) {
    const list = cases.map((entry) => ({ case_id: entry.case_id, ...this.evaluateCase(entry) }));
    return {
      total: list.length,
      critical: list.filter((entry) => entry.critical).length,
      list,
    };
  }
}

export const caseRiskEngine = new CaseRiskEngine();
