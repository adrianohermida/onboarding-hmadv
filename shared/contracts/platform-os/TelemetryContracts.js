export const PLATFORM_TELEMETRY_PAYLOAD_VERSION = '1.0.0';

export function normalizePlatformTelemetryPayload(payload = {}) {
  return {
    telemetry_id: payload.telemetry_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    category: payload.category || 'runtime',
    name: payload.name || 'platform.event',
    value: Number(payload.value) || 0,
    degraded: payload.degraded === true,
    failed: payload.failed === true,
    trace_id: payload.trace_id || null,
    version: payload.version || PLATFORM_TELEMETRY_PAYLOAD_VERSION,
  };
}
