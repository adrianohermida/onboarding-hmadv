/**
 * EventBus — event-driven architecture para o Portal CNJ
 * Eventos disponíveis:
 *   journey.step.state_changed  { stepId, state }
 *   journey.step.completed      { stepId }
 *   video.ready                 { dbVideoId, ytVideoId }
 *   video.progress              { dbVideoId, pct, cur, dur, maxPct }
 *   video.completed             { dbVideoId }
 *   debt.created                { debt }
 *   debt.updated                { id, changes }
 *   document.uploaded           { tipo, path }
 *   onboarding.completed        { userId }
 *   financial.score.changed     { score, severity }
 *   minimum.existential.updated { value, nDeps }
 */
export class EventBus extends EventTarget {
  constructor() {
    super();
    this._listenerMap = new Map();
  }

  /** Emite evento com payload */
  emit(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, { detail, bubbles: false }));
  }

  /** Assina evento. Retorna função de unsubscribe. */
  on(event, handler) {
    const wrapper = (e) => handler(e.detail, e);
    const eventMap = this._listenerMap.get(event) || new WeakMap();
    eventMap.set(handler, wrapper);
    this._listenerMap.set(event, eventMap);
    this.addEventListener(event, wrapper);
    return () => this.removeEventListener(event, wrapper);
  }

  /** Remove listener registered by handler reference */
  off(event, handler) {
    const eventMap = this._listenerMap.get(event);
    const wrapper = eventMap?.get(handler) || handler;
    this.removeEventListener(event, wrapper);
    eventMap?.delete(handler);
  }

  /** Assina uma única vez */
  once(event, handler) {
    const wrapper = (e) => handler(e.detail, e);
    this.addEventListener(event, wrapper, { once: true });
  }
}

/** Instância singleton do barramento de eventos */
export const bus = new EventBus();
