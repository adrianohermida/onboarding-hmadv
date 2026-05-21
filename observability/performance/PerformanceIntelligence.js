export class PerformanceIntelligence {
  constructor() {
    this._metrics = {
      bundle_size_kb: null,
      route_size_kb: {},
      lazy_load_timing_ms: {},
      render_blocking_ms: [],
      api_latency_ms: [],
      upload_latency_ms: [],
      mobile_performance_score: null,
    };
  }

  setBundleSize(kb) { this._metrics.bundle_size_kb = Number(kb) || 0; }
  setRouteSize(route, kb) { this._metrics.route_size_kb[route] = Number(kb) || 0; }
  setLazyLoadTiming(name, ms) { this._metrics.lazy_load_timing_ms[name] = Number(ms) || 0; }
  observeRenderBlocking(ms) { this._metrics.render_blocking_ms.unshift(Number(ms) || 0); }
  observeApiLatency(ms) { this._metrics.api_latency_ms.unshift(Number(ms) || 0); }
  observeUploadLatency(ms) { this._metrics.upload_latency_ms.unshift(Number(ms) || 0); }
  setMobilePerformanceScore(score) { this._metrics.mobile_performance_score = Number(score) || 0; }

  snapshot() {
    const calcAvg = (list) => list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0;
    const sortedApi = [...this._metrics.api_latency_ms].sort((a, b) => a - b);
    const p95Index = sortedApi.length ? Math.floor(sortedApi.length * 0.95) : 0;

    return {
      ...this._metrics,
      avg_render_blocking_ms: calcAvg(this._metrics.render_blocking_ms),
      avg_api_latency_ms: calcAvg(this._metrics.api_latency_ms),
      avg_upload_latency_ms: calcAvg(this._metrics.upload_latency_ms),
      p95_api_latency_ms: sortedApi[p95Index] || 0,
      sampled_at: new Date().toISOString(),
    };
  }
}

export const performanceIntelligence = new PerformanceIntelligence();
