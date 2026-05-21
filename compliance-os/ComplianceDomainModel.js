const COMPLIANCE_DOMAIN_ENTITIES = [
  'LgpdPolicy',
  'ConsentRecord',
  'DataClassification',
  'PrivacyControl',
  'AuditEvent',
  'RiskSignal',
  'AccessEvent',
  'RetentionPolicy',
  'IncidentRecord',
  'LineageEvent',
  'ComplianceTelemetry',
  'ComplianceAnalytics',
  'DataSubjectRequestFoundation',
  'ComplianceReport',
];

export function listComplianceDomainEntities() {
  return [...COMPLIANCE_DOMAIN_ENTITIES];
}

export default COMPLIANCE_DOMAIN_ENTITIES;
