const RETENTION_POLICIES = {
  legal_default_5y: { years: 5, legal_hold: false },
  financial_10y: { years: 10, legal_hold: false },
  cnj_case_20y: { years: 20, legal_hold: true },
};

export function resolveRetentionPolicy(key = 'legal_default_5y') {
  return RETENTION_POLICIES[key] || RETENTION_POLICIES.legal_default_5y;
}

export function buildRetentionRecord(payload = {}) {
  const policyKey = payload.retention_policy || 'legal_default_5y';
  return {
    document_id: payload.document_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    retention_policy: policyKey,
    policy: resolveRetentionPolicy(policyKey),
    archive_after: payload.archive_after || null,
    delete_after: payload.delete_after || null,
    status: 'active',
    created_at: new Date().toISOString(),
  };
}
