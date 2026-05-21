import { createEventEnvelope } from '../contracts/EventEnvelope.js';
import { validateEventEnvelope } from '../contracts/EventValidator.js';
import { deadLetterQueue } from '../dead-letter/DeadLetterQueue.js';
import { eventTelemetry } from '../telemetry/EventTelemetry.js';
import { eventLogger } from '../logs/EventLogger.js';
import { getEventDefinition } from '../registry/EventRegistry.js';

const HISTORY_LIMIT = 50;

export class EnterpriseEventBus extends EventTarget {
  constructor() {
    super();
    this._history = new Map();
    this._handlerMap = new Map();
  }

  publish(eventName, payload = {}, meta = {}) {
    const start = performance.now();
    const definition = getEventDefinition(eventName);
    const envelope = createEventEnvelope(eventName, payload, {
      ...meta,
      version: meta.version || definition?.version || '1.0.0',
    });

    const validation = validateEventEnvelope(envelope, definition);
    if (!validation.valid) {
      eventTelemetry.markFailed();
      deadLetterQueue.push({ envelope, errors: validation.errors, reason: 'validation_failed' });
      eventTelemetry.markDeadLetter();
      eventTelemetry.setQueueDepth(deadLetterQueue.list().length);
      eventLogger.log('publish.failed', eventName, { errors: validation.errors });
      return { ok: false, errors: validation.errors, envelope };
    }

    this._appendHistory(eventName, envelope);
    eventTelemetry.markPublished();
    eventLogger.log('publish', eventName, { correlation_id: envelope.correlation_id });

    this.dispatchEvent(new CustomEvent(eventName, { detail: envelope, bubbles: false }));
    this.dispatchEvent(new CustomEvent('event:*', { detail: envelope, bubbles: false }));

    const publishMs = Math.round(performance.now() - start);
    eventTelemetry.observeLatency(publishMs);
    eventTelemetry.observePublishTiming(publishMs);
    return { ok: true, envelope };
  }

  subscribe(eventName, handler, options = {}) {
    const wrapped = (ev) => {
      const start = performance.now();
      try {
        eventTelemetry.markProcessed();
        handler(ev.detail, ev);
      } catch (error) {
        eventTelemetry.markFailed();
        const envelope = ev?.detail;
        deadLetterQueue.push({ envelope, error: String(error), reason: 'subscriber_failed' });
        eventTelemetry.markDeadLetter();
        eventTelemetry.setQueueDepth(deadLetterQueue.list().length);
        eventLogger.log('subscriber.failed', eventName, { error: String(error) });
        throw error;
      } finally {
        eventTelemetry.observeSubscriberTiming(Math.round(performance.now() - start));
      }
    };

    this.addEventListener(eventName, wrapped);

    if (options.replayLast) {
      const replayItems = this._history.get(eventName) || [];
      replayItems.slice(-1 * options.replayLast).forEach((item) => {
        try { handler(item); } catch (_) {}
      });
    }

    this._handlerMap.set(handler, wrapped);
    eventLogger.log('subscribe', eventName, {});

    return () => this.unsubscribe(eventName, handler);
  }

  replayFuture(eventName, handler, options = {}) {
    return this.subscribe(eventName, handler, { replayLast: options.replayLast || 1 });
  }

  unsubscribe(eventName, handler) {
    const wrapped = this._handlerMap.get(handler) || handler;
    this.removeEventListener(eventName, wrapped);
    this._handlerMap.delete(handler);
    eventLogger.log('unsubscribe', eventName, {});
  }

  once(eventName, handler) {
    const wrapped = (ev) => handler(ev.detail, ev);
    this.addEventListener(eventName, wrapped, { once: true });
  }

  getTelemetry() {
    return eventTelemetry.snapshot();
  }

  getHistory(eventName) {
    return [...(this._history.get(eventName) || [])];
  }

  _appendHistory(eventName, envelope) {
    const current = this._history.get(eventName) || [];
    current.push(envelope);
    if (current.length > HISTORY_LIMIT) current.shift();
    this._history.set(eventName, current);
  }
}

export const enterpriseBus = new EnterpriseEventBus();
