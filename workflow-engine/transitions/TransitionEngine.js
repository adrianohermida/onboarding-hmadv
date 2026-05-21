export function validateTransition(definition, from, to) {
  const transitions = definition?.transitions || {};
  const allowed = transitions[from] || [];
  return allowed.includes(to);
}

export function applyTransition(entity, to, context = {}) {
  return {
    ...entity,
    state: to,
    updated_at: new Date().toISOString(),
    transition_meta: {
      actor: context.actor || 'system',
      tenant_id: context.tenant_id || entity.tenant_id || 'hmadv',
      workflow_id: context.workflow_id || null,
      trace_id: context.trace_id || null,
    },
  };
}
