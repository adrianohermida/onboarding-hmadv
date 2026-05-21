export class RuntimeIntelligence {
  constructor() {
    this._samples = [];
    this._issues = [];
  }

  captureMemory(meta = {}) {
    const memory = performance && performance.memory
      ? {
          used_js_heap_size: performance.memory.usedJSHeapSize,
          total_js_heap_size: performance.memory.totalJSHeapSize,
          js_heap_size_limit: performance.memory.jsHeapSizeLimit,
        }
      : null;

    const safePath = meta.path
      || (typeof window !== 'undefined' ? window.location.pathname : 'runtime://node');

    const sample = {
      memory,
      path: safePath,
      timestamp: new Date().toISOString(),
    };

    this._samples.unshift(sample);
    if (this._samples.length > 200) this._samples.length = 200;
    return sample;
  }

  reportIssue(type, detail = {}) {
    const issue = {
      type,
      detail,
      timestamp: new Date().toISOString(),
    };
    this._issues.unshift(issue);
    if (this._issues.length > 300) this._issues.length = 300;
    return issue;
  }

  snapshot() {
    return {
      samples: [...this._samples],
      issues: [...this._issues],
      issue_count: this._issues.length,
      last_sample_at: this._samples[0]?.timestamp || null,
    };
  }
}

export const runtimeIntelligence = new RuntimeIntelligence();
