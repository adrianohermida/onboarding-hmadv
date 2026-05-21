import { bus } from '../../modules/events/EventBus.js';

export function mountFinancialEventHandlers() {
  const offDebtUpdated = bus.on('debt.updated', (payload) => {
    bus.emit('analytics.metric.recorded', {
      metric: 'debt.updated',
      value: 1,
      debt_id: payload?.debt?.id || payload?.id || null,
    });
  });

  return () => offDebtUpdated?.();
}
