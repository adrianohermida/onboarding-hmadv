import { normalizeMetricPayload } from './MetricsContracts.js';
import { normalizeKpiPayload } from './KpiContracts.js';
import { normalizePredictionPayload } from './PredictionContracts.js';
import { normalizeInsightPayload } from './InsightContracts.js';

export const analyticsContracts = {
  normalizeMetricPayload,
  normalizeKpiPayload,
  normalizePredictionPayload,
  normalizeInsightPayload,
};

export default analyticsContracts;
