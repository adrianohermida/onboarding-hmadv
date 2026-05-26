import { randomUUID } from 'node:crypto';

export function createTracePayload(context = {}) {
  return {
    ...context,
    trace_id: context.trace_id ?? randomUUID(),
    span_id: context.span_id ?? randomUUID().split('-')[0],
    timestamp: new Date().toISOString(),
  };
}
