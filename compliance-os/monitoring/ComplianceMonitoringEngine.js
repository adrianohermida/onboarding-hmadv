export class ComplianceMonitoringEngine {
  evaluate({ access = [], audit = [], consents = [], incidents = [] } = {}) {
    return {
      sensitive_access: access.filter((entry) => ['SENSIVEL', 'BIOMETRICO', 'FINANCEIRO', 'JURIDICO', 'LGPD_CRITICO'].includes(entry.sensitivity)).length,
      suspicious_access: access.filter((entry) => entry.suspicious).length,
      missing_audit_trails: 0,
      missing_consents: Math.max(0, access.length - consents.length),
      tenant_violations: access.filter((entry) => entry.tenant_id === null).length,
      retention_failures: 0,
      open_incidents: incidents.filter((entry) => entry.status !== 'resolved').length,
      audit_health: audit.length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const complianceMonitoringEngine = new ComplianceMonitoringEngine();
