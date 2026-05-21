import { existsSync } from 'node:fs';

const required = [
  'financial-intelligence/README.md',
  'financial-intelligence/FinancialDomainModel.js',
  'financial-intelligence/FinancialIntelligenceFoundation.js',
  'financial-intelligence/ShellFinancialVisibility.js',
  'financial-intelligence/debts/DebtEngine.js',
  'financial-intelligence/expenses/ExpenseEngine.js',
  'financial-intelligence/expenses/RecurringExpenseEngine.js',
  'financial-intelligence/income/IncomeEngine.js',
  'financial-intelligence/minimum-existential/MinimumExistentialEngine.js',
  'financial-intelligence/commitment/CommitmentEngine.js',
  'financial-intelligence/scores/FinancialScoreEngine.js',
  'financial-intelligence/risk/FinancialRiskEngine.js',
  'financial-intelligence/diagnosis/FinancialDiagnosisEngine.js',
  'financial-intelligence/eligibility/EligibilityEngine.js',
  'financial-intelligence/timelines/FinancialTimelineEngine.js',
  'financial-intelligence/monitoring/PaymentTrackingEngine.js',
  'financial-intelligence/monitoring/MonthlyUpdateEngine.js',
  'financial-intelligence/monitoring/FinancialMonitoringEngine.js',
  'financial-intelligence/monitoring/AutomatedAlertsEngine.js',
  'financial-intelligence/plans/PaymentPlanFoundation.js',
  'financial-intelligence/simulations/FinancialSimulationEngine.js',
  'financial-intelligence/projections/FinancialProjectionEngine.js',
  'financial-intelligence/cnj/CnjFinancialFoundation.js',
  'financial-intelligence/analytics/SuperendividamentoAnalytics.js',
  'financial-intelligence/telemetry/FinancialTelemetry.js',
  'financial-intelligence/calculations/FinancialCalculations.js',
  'financial-intelligence/governance/FinancialGovernanceEngine.js',
  'financial-intelligence/docs/financial-intelligence-foundation.md',
  'financial-intelligence/governance/financial-intelligence-governance.md',
  'shared/contracts/financial/FinancialContracts.js',
  'docs/financial/README.md',
  'docs/financial/calculations.md',
  'docs/financial/scores.md',
  'docs/financial/commitment.md',
  'docs/financial/minimum-existential.md',
  'docs/financial/eligibility.md',
  'docs/financial/timelines.md',
  'docs/financial/analytics.md',
  'governance/financial/calculation-standards.md',
  'governance/financial/commitment-standards.md',
  'governance/financial/minimum-existential-standards.md',
  'governance/financial/score-standards.md',
  'governance/financial/timeline-standards.md',
  'governance/financial/ai-financial-governance.md',
  'governance/financial/module-requirements.md',
  'pages/financeiro-inteligencia.html',
  'admin/financial/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:financial-intelligence failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:financial-intelligence passed');
