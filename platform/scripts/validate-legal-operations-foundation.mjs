import { existsSync } from 'node:fs';

const required = [
  'legal-operations/README.md',
  'legal-operations/LegalOperationsDomainModel.js',
  'legal-operations/LegalOperationsFoundation.js',
  'legal-operations/ShellLegalOperationsVisibility.js',
  'legal-operations/cases/CaseEngine.js',
  'legal-operations/clients/ClientOpsEngine.js',
  'legal-operations/journeys/ClientJourneyEngine.js',
  'legal-operations/procedures/ProceduralEngine.js',
  'legal-operations/timelines/ProceduralTimelineEngine.js',
  'legal-operations/assignments/AssignmentEngine.js',
  'legal-operations/tasks/TaskEngine.js',
  'legal-operations/deadlines/DeadlineEngine.js',
  'legal-operations/hearings/HearingFoundation.js',
  'legal-operations/communications/ClientCommunicationEngine.js',
  'legal-operations/negotiations/NegotiationEngine.js',
  'legal-operations/agreements/AgreementEngine.js',
  'legal-operations/sla/LegalSlaEngine.js',
  'legal-operations/analytics/CaseAnalyticsEngine.js',
  'legal-operations/productivity/ProductivityEngine.js',
  'legal-operations/monitoring/CaseMonitoringEngine.js',
  'legal-operations/risk/CaseRiskEngine.js',
  'legal-operations/collaboration/CollaborationFoundation.js',
  'legal-operations/telemetry/CaseTelemetry.js',
  'legal-operations/governance/LegalOperationsGovernanceEngine.js',
  'legal-operations/docs/legal-operations-foundation.md',
  'legal-operations/governance/legal-operations-governance.md',
  'shared/contracts/legal-operations/LegalOperationsContracts.js',
  'docs/legal-operations/README.md',
  'docs/legal-operations/lifecycle.md',
  'docs/legal-operations/slas.md',
  'docs/legal-operations/timelines.md',
  'docs/legal-operations/negotiations.md',
  'docs/legal-operations/workflows.md',
  'docs/legal-operations/dashboards.md',
  'docs/legal-operations/analytics.md',
  'governance/legal-operations/lifecycle-standards.md',
  'governance/legal-operations/sla-standards.md',
  'governance/legal-operations/assignment-standards.md',
  'governance/legal-operations/timeline-standards.md',
  'governance/legal-operations/negotiation-standards.md',
  'governance/legal-operations/ai-legal-governance.md',
  'governance/legal-operations/module-requirements.md',
  'pages/operacoes-juridicas.html',
  'admin/legal-operations/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:legal-operations failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:legal-operations passed');
