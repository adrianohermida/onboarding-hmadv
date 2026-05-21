import { bus } from '../../modules/events/EventBus.js';

export function mountAnalyticsEventHandlers() {
  const offMetric = bus.on('analytics.metric.recorded', () => {
    // Foundation hook for BI and analytics pipeline integration.
  });

  return () => offMetric?.();
}
