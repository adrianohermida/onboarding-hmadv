export function classifyLimitState(usageItem, { softThreshold = 85, hardThreshold = 100 } = {}) {
  const pct = Number(usageItem?.usage_pct || 0);
  if (pct >= hardThreshold || usageItem?.exceeded) return 'hard_limit';
  if (pct >= softThreshold) return 'soft_limit';
  return 'ok';
}

export function buildLimitAlert(usageItem, key) {
  const state = classifyLimitState(usageItem);
  if (state === 'ok') return null;
  return {
    key,
    state,
    usage_pct: usageItem?.usage_pct || 0,
    message: state === 'hard_limit'
      ? `Hard limit reached for ${key}`
      : `Soft limit warning for ${key}`,
  };
}
