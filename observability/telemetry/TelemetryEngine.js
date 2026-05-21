import { metricsRegistry } from '../metrics/MetricsRegistry.js';
import { structuredLogger } from '../logs/StructuredLogger.js';
import { getActiveTrace } from '../tracing/TraceContext.js';

export class TelemetryEngine {
  recordTiming(name, ms, meta = {}) {
    const activeTrace = getActiveTrace();
    const payload = {
      name,
      value: Number(ms) || 0,
      unit: 'ms',
      type: 'histogram',
      tenant_id: meta.tenant_id || activeTrace?.tenant_id || 'hmadv',
      module: meta.module || 'runtime',
      trace_id: meta.trace_id || activeTrace?.trace_id || null,
      tags: meta.tags || {},
    };

    const result = metricsRegistry.record(payload);
    if (!result.ok) {
      structuredLogger.log({
        severity: 'warn',
        message: 'telemetry timing rejected',
        source_module: 'telemetry',
        data: { name, ms, errors: result.errors },
      });
    }

    return result;
  }

  trackRouteTiming(path, ms, meta = {}) {
    return this.recordTiming('route.timing', ms, { ...meta, module: 'shell', tags: { path } });
  }

  trackModuleLoad(moduleName, ms, meta = {}) {
    return this.recordTiming('module.load.timing', ms, { ...meta, module: moduleName, tags: { module: moduleName } });
  }

  trackModuleRender(moduleName, ms, meta = {}) {
    return this.recordTiming('module.render.timing', ms, { ...meta, module: moduleName, tags: { module: moduleName } });
  }

  trackUploadTiming(ms, meta = {}) {
    return this.recordTiming('upload.timing', ms, { ...meta, module: 'documents' });
  }

  trackOnboardingTiming(ms, meta = {}) {
    return this.recordTiming('onboarding.timing', ms, { ...meta, module: 'onboarding' });
  }

  trackApiTiming(endpoint, ms, meta = {}) {
    return this.recordTiming('api.timing', ms, { ...meta, module: 'api', tags: { endpoint } });
  }

  trackWorkflowTiming(workflowName, ms, meta = {}) {
    return this.recordTiming('workflow.timing', ms, { ...meta, module: 'workflow', tags: { workflow: workflowName } });
  }

  trackRenderTiming(scope, ms, meta = {}) {
    return this.recordTiming('render.timing', ms, { ...meta, module: 'ui', tags: { scope } });
  }
}

export const telemetryEngine = new TelemetryEngine();
