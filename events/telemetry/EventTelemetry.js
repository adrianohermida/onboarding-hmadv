export class EventTelemetry {
  constructor() {
    this._counters = {
      published: 0,
      failed: 0,
      retried: 0,
      processed: 0,
      dead_letter: 0,
    };
    this._latencies = [];
    this._publishTimings = [];
    this._subscriberTimings = [];
    this._queueDepth = 0;
  }

  markPublished() { this._counters.published += 1; }
  markFailed() { this._counters.failed += 1; }
  markRetried() { this._counters.retried += 1; }
  markProcessed() { this._counters.processed += 1; }
  markDeadLetter() { this._counters.dead_letter += 1; }

  observeLatency(ms) {
    if (Number.isFinite(ms) && ms >= 0) {
      this._latencies.push(ms);
      if (this._latencies.length > 200) this._latencies.shift();
    }
  }

  observePublishTiming(ms) {
    if (Number.isFinite(ms) && ms >= 0) {
      this._publishTimings.push(ms);
      if (this._publishTimings.length > 200) this._publishTimings.shift();
    }
  }

  observeSubscriberTiming(ms) {
    if (Number.isFinite(ms) && ms >= 0) {
      this._subscriberTimings.push(ms);
      if (this._subscriberTimings.length > 400) this._subscriberTimings.shift();
    }
  }

  setQueueDepth(depth) {
    this._queueDepth = Number.isFinite(depth) && depth >= 0 ? Math.round(depth) : 0;
  }

  snapshot() {
    const calcAvg = (items) => {
      const total = items.reduce((sum, item) => sum + item, 0);
      return items.length ? Math.round(total / items.length) : 0;
    };

    return {
      ...this._counters,
      queue_size: this._queueDepth,
      avg_latency_ms: calcAvg(this._latencies),
      avg_publish_timing_ms: calcAvg(this._publishTimings),
      avg_subscriber_timing_ms: calcAvg(this._subscriberTimings),
      samples: this._latencies.length,
    };
  }
}

export const eventTelemetry = new EventTelemetry();
