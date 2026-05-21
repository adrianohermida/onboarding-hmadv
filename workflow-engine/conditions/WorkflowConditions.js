export const WorkflowConditions = {
  always: () => true,
  hasTenant: (ctx = {}) => !!ctx.tenant_id,
  hasActor: (ctx = {}) => !!ctx.actor,
  hasCaseId: (ctx = {}) => !!ctx.case_id,
};

export function checkConditions(conditions = [], context = {}) {
  return conditions.every((condition) => {
    if (typeof condition === 'function') return !!condition(context);
    const fn = WorkflowConditions[condition];
    return typeof fn === 'function' ? !!fn(context) : false;
  });
}
