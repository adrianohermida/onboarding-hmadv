export function evaluateQuotaUsage(limit, used) {
  const safeLimit = Number(limit) || 0;
  const safeUsed = Number(used) || 0;
  const pct = safeLimit > 0 ? Math.round((safeUsed / safeLimit) * 100) : 0;
  return {
    limit: safeLimit,
    used: safeUsed,
    remaining: Math.max(0, safeLimit - safeUsed),
    usage_pct: pct,
    exceeded: safeLimit > 0 ? safeUsed > safeLimit : false,
  };
}

export function evaluateAllQuotas(entitlements = {}, usage = {}) {
  const limits = entitlements?.limits || {};
  const entries = Object.keys(limits);
  return entries.reduce((acc, key) => {
    acc[key] = evaluateQuotaUsage(limits[key], usage[key] || 0);
    return acc;
  }, {});
}
