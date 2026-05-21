import { existsSync } from 'node:fs';

const required = [
  'compliance-os/README.md',
  'compliance-os/ComplianceDomainModel.js',
  'compliance-os/ComplianceOSFoundation.js',
  'compliance-os/ShellComplianceVisibility.js',
  'compliance-os/lgpd/LgpdGovernanceFoundation.js',
  'compliance-os/consents/ConsentEngine.js',
  'compliance-os/privacy/PrivacyLayer.js',
  'compliance-os/retention/RetentionGovernanceEngine.js',
  'compliance-os/audit/AuditabilityEngine.js',
  'compliance-os/risk/RiskGovernanceEngine.js',
  'compliance-os/governance/ComplianceGovernanceEngine.js',
  'compliance-os/policies/DataSubjectFoundation.js',
  'compliance-os/classification/DataClassificationEngine.js',
  'compliance-os/security/SecurityComplianceMonitoring.js',
  'compliance-os/incidents/IncidentFoundation.js',
  'compliance-os/access/AccessGovernanceEngine.js',
  'compliance-os/lineage/DataLineageFoundation.js',
  'compliance-os/monitoring/ComplianceMonitoringEngine.js',
  'compliance-os/telemetry/ComplianceTelemetry.js',
  'compliance-os/analytics/ComplianceAnalyticsEngine.js',
  'compliance-os/reports/DataAccessReportsFoundation.js',
  'compliance-os/docs/compliance-os-foundation.md',
  'compliance-os/governance/compliance-os-governance.md',
  'shared/contracts/compliance/ComplianceContracts.js',
  'docs/compliance/README.md',
  'docs/compliance/lgpd.md',
  'docs/compliance/auditability.md',
  'docs/compliance/retention.md',
  'docs/compliance/access.md',
  'docs/compliance/privacy.md',
  'docs/compliance/governance.md',
  'docs/compliance/ai-compliance.md',
  'governance/compliance/lgpd-standards.md',
  'governance/compliance/audit-standards.md',
  'governance/compliance/retention-standards.md',
  'governance/compliance/classification-standards.md',
  'governance/compliance/ai-compliance-standards.md',
  'governance/compliance/module-requirements.md',
  'pages/compliance.html',
  'admin/compliance/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:compliance-os failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:compliance-os passed');
