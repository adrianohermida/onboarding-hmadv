export function serializeApiResponse(data, meta = {}) {
  return {
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
}

export function serializeEventPayload(payload, envelope = {}) {
  return {
    event: envelope.event || null,
    version: envelope.version || '1.0.0',
    tenant_id: envelope.tenant_id || null,
    correlation_id: envelope.correlation_id || null,
    request_id: envelope.request_id || null,
    payload,
  };
}
