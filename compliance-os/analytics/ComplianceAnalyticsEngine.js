export class ComplianceAnalyticsEngine {
  snapshot({ consents = [], audit = [], access = [], retention = {}, workflows = {}, integrations = {} } = {}) {
    const acceptedConsents = consents.filter((entry) => entry.accepted && !entry.revoked).length;
    const sensitiveAccess = access.filter((entry) => ['SENSIVEL', 'BIOMETRICO', 'FINANCEIRO', 'JURIDICO', 'LGPD_CRITICO'].includes(entry.sensitivity)).length;

    return {
      consent_coverage: consents.length ? acceptedConsents / consents.length : 0,
      audit_coverage: audit.length,
      sensitive_access: sensitiveAccess,
      retention_compliance: Number(retention.compliance_score) || 100,
      workflow_compliance: Number(workflows.compliance_score) || 100,
      integration_compliance: Number(integrations.compliance_score) || 100,
      generated_at: new Date().toISOString(),
    };
  }
}

export const complianceAnalyticsEngine = new ComplianceAnalyticsEngine();
