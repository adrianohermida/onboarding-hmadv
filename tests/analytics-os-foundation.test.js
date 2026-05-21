import { describe, expect, it } from 'vitest';
import { enterpriseMetricsEngine } from '../analytics-os/metrics/EnterpriseMetricsEngine.js';
import { analyticsTelemetry } from '../analytics-os/telemetry/AnalyticsTelemetry.js';
import { analyticsOsFoundation } from '../analytics-os/AnalyticsOSFoundation.js';

describe('analytics os foundation', () => {
  it('builds analytics snapshot with metrics, kpis and executive view', () => {
    enterpriseMetricsEngine.emit({ tenant_id: 'tenant-ana', domain: 'onboarding', name: 'onboarding.progressed', value: 1 });
    enterpriseMetricsEngine.emit({ tenant_id: 'tenant-ana', domain: 'financial', name: 'financial.updated.monthly', value: 1 });
    analyticsTelemetry.track({ tenant_id: 'tenant-ana', category: 'metric', name: 'analytics.event', value: 1 });

    const snapshot = analyticsOsFoundation.snapshot('tenant-ana');

    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.metrics.total).toBeGreaterThanOrEqual(2);
    expect(snapshot.kpis.onboarding.completion_rate).toBeGreaterThanOrEqual(0);
    expect(snapshot.executive).toBeTruthy();
  });

  it('exposes governance and observability controls for enterprise analytics', () => {
    const snapshot = analyticsOsFoundation.snapshot('tenant-ana');

    expect(snapshot.governance.metric_naming_standard).toBe(true);
    expect(snapshot.governance.dashboard_standard).toBe(true);
    expect(snapshot.observability).toBeTruthy();
  });
});
