import { describe, expect, it } from 'vitest';
import { normalizeMetricPayload } from '../shared/contracts/analytics/MetricsContracts.js';
import { normalizeKpiPayload } from '../shared/contracts/analytics/KpiContracts.js';
import { normalizePredictionPayload } from '../shared/contracts/analytics/PredictionContracts.js';
import { normalizeInsightPayload } from '../shared/contracts/analytics/InsightContracts.js';

describe('analytics contracts', () => {
  it('normalizes metric and kpi payloads', () => {
    const metric = normalizeMetricPayload({ tenant_id: 'tenant-ana', domain: 'onboarding', name: 'onboarding.progressed', value: 2 });
    const kpi = normalizeKpiPayload({ tenant_id: 'tenant-ana', onboarding: { completion_rate: 0.8 } });

    expect(metric.tenant_id).toBe('tenant-ana');
    expect(metric.value).toBe(2);
    expect(kpi.onboarding.completion_rate).toBe(0.8);
  });

  it('normalizes prediction and insight payloads', () => {
    const prediction = normalizePredictionPayload({ abandonment_forecast: 0.2, default_forecast: 0.3 });
    const insight = normalizeInsightPayload({ operational_insights: ['throughput estavel'] });

    expect(prediction.abandonment_forecast).toBe(0.2);
    expect(prediction.default_forecast).toBe(0.3);
    expect(insight.operational_insights.length).toBe(1);
  });
});
