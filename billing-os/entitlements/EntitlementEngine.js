import { planEngine } from '../plans/PlanEngine.js';

class EntitlementEngine {
  resolve(subscription = {}) {
    const plan = planEngine.get(subscription.plan_code || 'starter');
    const tier = plan.code;
    return {
      tenant_id: subscription.tenant_id || 'hmadv',
      plan_code: tier,
      limits: { ...plan.limits },
      features: {
        workspace_runtime: true,
        workflow_automation: tier !== 'free',
        ai_assistant: tier === 'professional' || tier === 'enterprise' || tier === 'white_label_future',
        analytics_advanced: tier === 'professional' || tier === 'enterprise' || tier === 'white_label_future',
        enterprise_security: tier === 'enterprise' || tier === 'white_label_future',
        white_label: tier === 'white_label_future',
      },
      generated_at: new Date().toISOString(),
    };
  }
}

export const entitlementEngine = new EntitlementEngine();
