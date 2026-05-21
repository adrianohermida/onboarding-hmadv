import { planEngine } from '../plans/PlanEngine.js';

const subscriptions = new Map();

function defaultSubscription(tenant_id = 'hmadv') {
  return {
    subscription_id: `sub_${tenant_id}`,
    tenant_id,
    plan_code: 'starter',
    status: 'active',
    trial_active: false,
    renewal_at: null,
    canceled_at: null,
    updated_at: new Date().toISOString(),
  };
}

class SubscriptionEngine {
  get(tenant_id = 'hmadv') {
    if (!subscriptions.has(tenant_id)) subscriptions.set(tenant_id, defaultSubscription(tenant_id));
    return subscriptions.get(tenant_id);
  }

  create(payload = {}) {
    const tenant_id = payload.tenant_id || 'hmadv';
    const next = {
      ...defaultSubscription(tenant_id),
      ...payload,
      plan_code: planEngine.get(payload.plan_code || 'starter').code,
      status: payload.status || 'active',
      updated_at: new Date().toISOString(),
    };
    subscriptions.set(tenant_id, next);
    return next;
  }

  upgrade(tenant_id = 'hmadv', target_plan = 'professional') {
    return this.create({ ...this.get(tenant_id), plan_code: planEngine.get(target_plan).code, status: 'active' });
  }

  downgrade(tenant_id = 'hmadv', target_plan = 'starter') {
    return this.create({ ...this.get(tenant_id), plan_code: planEngine.get(target_plan).code, status: 'active' });
  }

  cancel(tenant_id = 'hmadv') {
    return this.create({ ...this.get(tenant_id), status: 'canceled', canceled_at: new Date().toISOString() });
  }

  enableTrial(tenant_id = 'hmadv', renewal_at = null) {
    return this.create({ ...this.get(tenant_id), trial_active: true, renewal_at: renewal_at || new Date(Date.now() + (14 * 24 * 3600 * 1000)).toISOString() });
  }

  renew(tenant_id = 'hmadv', renewal_at = null) {
    return this.create({ ...this.get(tenant_id), status: 'active', renewal_at: renewal_at || new Date(Date.now() + (30 * 24 * 3600 * 1000)).toISOString() });
  }
}

export const subscriptionEngine = new SubscriptionEngine();
