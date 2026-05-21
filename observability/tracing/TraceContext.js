import { createTracePayload } from '../../shared/contracts/observability/TraceContracts.js';

class TraceContextStore {
  constructor() {
    this._stack = [];
  }

  current() {
    return this._stack.length ? this._stack[this._stack.length - 1] : null;
  }

  push(context = {}) {
    const parent = this.current();
    const payload = createTracePayload({
      ...parent,
      ...context,
      parent_span_id: context.parent_span_id || parent?.span_id || null,
      trace_id: context.trace_id || parent?.trace_id,
      correlation_id: context.correlation_id || parent?.correlation_id,
      request_id: context.request_id || parent?.request_id,
      tenant_id: context.tenant_id || parent?.tenant_id || 'hmadv',
    });

    this._stack.push(payload);
    return payload;
  }

  pop() {
    return this._stack.pop() || null;
  }

  withContext(context, callback) {
    const active = this.push(context);
    try {
      return callback(active);
    } finally {
      this.pop();
    }
  }
}

export const traceContextStore = new TraceContextStore();

export function createChildTrace(context = {}) {
  return traceContextStore.push(context);
}

export function getActiveTrace() {
  return traceContextStore.current();
}
