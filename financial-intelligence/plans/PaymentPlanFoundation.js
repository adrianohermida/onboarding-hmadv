export class PaymentPlanFoundation {
  build(payload = {}) {
    return {
      plan_id: payload.plan_id || `plan_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      type: payload.type || 'renegociacao',
      installments: Number(payload.installments) || 12,
      sustainable: payload.sustainable !== false,
      negotiation_strategy: payload.negotiation_strategy || 'progressiva',
      projection_ref: payload.projection_ref || null,
      created_at: new Date().toISOString(),
    };
  }
}

export const paymentPlanFoundation = new PaymentPlanFoundation();
