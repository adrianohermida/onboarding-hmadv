export function normalizeIntegrationResponse(payload = {}) {
  return {
    ok: payload.ok !== false,
    provider: String(payload.provider || '').trim(),
    operation: String(payload.operation || '').trim(),
    tenant_id: String(payload.tenant_id || 'hmadv'),
    status_code: Number(payload.status_code) || 200,
    latency_ms: Number(payload.latency_ms) || 0,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
    error: payload.error ? String(payload.error) : null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
