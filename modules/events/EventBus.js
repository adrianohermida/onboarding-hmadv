import { enterpriseBus } from '../../events/bus/EnterpriseEventBus.js';

/**
 * EventBus compatibility adapter.
 * Keeps the historical emit/on/off/once API while routing everything
 * through the enterprise event foundation.
 */
export class EventBus {
  emit(event, detail = {}, meta = {}) {
    const result = enterpriseBus.publish(event, detail, meta);
    return result?.envelope || detail;
  }

  publish(event, detail = {}, meta = {}) {
    return enterpriseBus.publish(event, detail, meta);
  }

  on(event, handler, options = {}) {
    return enterpriseBus.subscribe(event, (envelope) => {
      const payload = envelope?.payload ?? envelope;
      handler(payload, envelope);
    }, options);
  }

  subscribe(event, handler, options = {}) {
    return enterpriseBus.subscribe(event, handler, options);
  }

  replayFuture(event, handler, options = {}) {
    return enterpriseBus.replayFuture(event, (envelope) => {
      const payload = envelope?.payload ?? envelope;
      handler(payload, envelope);
    }, options);
  }

  off(event, handler) {
    enterpriseBus.unsubscribe(event, handler);
  }

  once(event, handler) {
    enterpriseBus.once(event, (envelope) => {
      const payload = envelope?.payload ?? envelope;
      handler(payload, envelope);
    });
  }

  telemetry() {
    return enterpriseBus.getTelemetry();
  }
}

export const bus = new EventBus();
