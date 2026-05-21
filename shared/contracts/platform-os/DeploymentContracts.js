export const PLATFORM_DEPLOYMENT_PAYLOAD_VERSION = '1.0.0';

export function normalizeDeploymentPayload(payload = {}) {
  return {
    deployment_id: payload.deployment_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    environment: payload.environment || 'production',
    strategy: payload.strategy || 'rolling',
    status: payload.status || 'success',
    rollback_ready: payload.rollback_ready !== false,
    observability_ready: payload.observability_ready !== false,
    trace_id: payload.trace_id || null,
    version: payload.version || PLATFORM_DEPLOYMENT_PAYLOAD_VERSION,
  };
}
