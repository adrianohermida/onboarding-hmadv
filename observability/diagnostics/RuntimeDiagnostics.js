import { runtimeIntelligence } from '../runtime/RuntimeIntelligence.js';

export class RuntimeDiagnostics {
  run() {
    const snapshot = runtimeIntelligence.snapshot();
    const findings = [];

    const latest = snapshot.samples[0];
    if (latest?.memory) {
      const ratio = latest.memory.used_js_heap_size / Math.max(latest.memory.js_heap_size_limit, 1);
      if (ratio > 0.85) {
        findings.push({
          code: 'memory.high_usage',
          severity: 'high',
          message: `Heap usage above threshold: ${(ratio * 100).toFixed(1)}%`,
        });
      }
    }

    const hydrationIssues = snapshot.issues.filter((item) => item.type === 'hydration.issue').length;
    if (hydrationIssues > 0) {
      findings.push({
        code: 'hydration.detected',
        severity: 'medium',
        message: `Hydration issues detected: ${hydrationIssues}`,
      });
    }

    return {
      findings,
      healthy: findings.length === 0,
      executed_at: new Date().toISOString(),
    };
  }
}

export const runtimeDiagnostics = new RuntimeDiagnostics();
