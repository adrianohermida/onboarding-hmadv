import { debtEngine } from '../debts/DebtEngine.js';

const MAX_EVENTS = 3000;

export class PaymentTrackingEngine {
  constructor() {
    this._events = [];
  }

  confirmPayment(payload = {}) {
    return this._record('payment.confirmed', payload);
  }

  reportDelay(payload = {}) {
    return this._record('payment.delay_reported', payload);
  }

  reportNegotiation(payload = {}) {
    return this._record('payment.negotiation_reported', payload);
  }

  updateInstallments(payload = {}) {
    return this._record('payment.installments_updated', payload);
  }

  updateDebt(payload = {}) {
    if (payload.register_new_debt) {
      debtEngine.register(payload.register_new_debt);
    }
    return this._record('debt.updated', payload);
  }

  _record(type, payload = {}) {
    const event = {
      type,
      debt_id: payload.debt_id || null,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      amount: Number(payload.amount) || 0,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_EVENTS) this._events.length = MAX_EVENTS;
    return event;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._events];
    return this._events.filter((item) => item.tenant_id === tenant_id);
  }
}

export const paymentTrackingEngine = new PaymentTrackingEngine();
