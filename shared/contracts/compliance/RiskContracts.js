export const COMPLIANCE_RISK_PAYLOAD_VERSION = '1.0.0';

export function normalizeRiskPayload(payload = {}) {
  return {
    risk_id: payload.risk_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    operational_risk: Number(payload.operational_risk) || 0,
    lgpd_risk: Number(payload.lgpd_risk) || 0,
    access_risk: Number(payload.access_risk) || 0,
    integration_risk: Number(payload.integration_risk) || 0,
    ai_risk: Number(payload.ai_risk) || 0,
    leakage_risk: Number(payload.leakage_risk) || 0,
    workflow_risk: Number(payload.workflow_risk) || 0,
    trace_id: payload.trace_id || null,
  };
}
