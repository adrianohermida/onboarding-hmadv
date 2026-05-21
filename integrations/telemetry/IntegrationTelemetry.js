const MAX_METRICS = 1000;

export class IntegrationTelemetry {
  constructor() {
    this._samples = [];
  }

  record(sample = {}) {
    const item = {
      provider: sample.provider || 'unknown',
      operation: sample.operation || 'unknown',
      latency_ms: Number(sample.latency_ms) || 0,
      throughput: Number(sample.throughput) || 0,
      retries: Number(sample.retries) || 0,
      failures: Number(sample.failures) || 0,
      degraded: !!sample.degraded,
      sla_violation: !!sample.sla_violation,
      tenant_id: sample.tenant_id || 'hmadv',
      trace_id: sample.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._samples.unshift(item);
    if (this._samples.length > MAX_METRICS) this._samples.length = MAX_METRICS;
    return item;
  }

  snapshot() {
    return {
      total: this._samples.length,
      failures: this._samples.reduce((sum, item) => sum + item.failures, 0),
      retries: this._samples.reduce((sum, item) => sum + item.retries, 0),
      sla_violations: this._samples.filter((item) => item.sla_violation).length,
      degraded: this._samples.filter((item) => item.degraded).length,
      list: [...this._samples],
    };
  }
}

export const integrationTelemetry = new IntegrationTelemetry();
