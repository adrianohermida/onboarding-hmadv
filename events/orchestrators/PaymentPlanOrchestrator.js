import { bus } from '../../modules/events/EventBus.js';

export function mountPaymentPlanOrchestrator() {
  const offDebtUpdated = bus.on('debt.updated', (payload, envelope) => {
    bus.emit('financial.score.changed', {
      score: payload?.score || null,
      debt_id: payload?.debt?.id || payload?.id || null,
    }, {
      tenant_id: envelope?.tenant_id,
      correlation_id: envelope?.correlation_id,
    });

    bus.emit('plan.recalculated', {
      debt_id: payload?.debt?.id || payload?.id || null,
      source: 'debt.updated',
    }, {
      tenant_id: envelope?.tenant_id,
      correlation_id: envelope?.correlation_id,
    });
  });

  const offPlanGenerated = bus.on('plan.generated', (payload, envelope) => {
    bus.emit('support.pipeline.updated', {
      plan_id: payload?.plan_id || null,
      stage: 'generated',
    }, {
      tenant_id: envelope?.tenant_id,
      correlation_id: envelope?.correlation_id,
    });
  });

  return () => {
    offDebtUpdated?.();
    offPlanGenerated?.();
  };
}
