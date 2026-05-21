export class EventTelemetry {
  constructor() {
    this._counters = {
      published: 0,
      failed: 0,
      retried: 0,
      processed: 0,
    };
    this._latencies = [];
  }

  markPublished() { this._counters.published += 1; }
  markFailed() { this._counters.failed += 1; }
  markRetried() { this._counters.retried += 1; }
  markProcessed() { this._counters.processed += 1; }

  observeLatency(ms) {
    if (Number.isFinite(ms) && ms >= 0) {
      this._latencies.push(ms);
      if (this._latencies.length > 200) this._latencies.shift();
    }
  }

  snapshot() {
    const totalLatency = this._latencies.reduce((sum, item) => sum + item, 0);
    const avgLatency = this._latencies.length ? Math.round(totalLatency / this._latencies.length) : 0;
    return {
      ...this._counters,
      queue_size: 0,
      avg_latency_ms: avgLatency,
      samples: this._latencies.length,
    };
  }
}

export const eventTelemetry = new EventTelemetry();
