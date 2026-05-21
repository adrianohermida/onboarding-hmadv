export class DashboardRegistry {
  list() {
    return [
      'executive_overview',
      'operations_overview',
      'financial_overview',
      'onboarding_overview',
      'legal_overview',
      'sla_overview',
      'compliance_overview',
    ];
  }
}

export const dashboardRegistry = new DashboardRegistry();
