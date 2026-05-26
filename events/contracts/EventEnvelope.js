import { randomUUID } from 'node:crypto';

export function createEventEnvelope(type, data, context = {}) {
  return {
    type,
    data,
    ...context,
    trace_id: randomUUID(),
    span_id: randomUUID().split('-')[0],
    request_id: randomUUID(),
    correlation_id: context.correlation_id ?? randomUUID(),
    timestamp: new Date().toISOString(),
  };
}
