export class DataAccessReportsFoundation {
  build({ access = [], audit = [], consents = [], retention = {} } = {}) {
    return {
      access_reports: access.length,
      audit_reports: audit.length,
      consent_reports: consents.length,
      retention_reports: retention ? 1 : 0,
      lgpd_reports: consents.filter((entry) => entry.consent_type === 'lgpd').length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const dataAccessReportsFoundation = new DataAccessReportsFoundation();
