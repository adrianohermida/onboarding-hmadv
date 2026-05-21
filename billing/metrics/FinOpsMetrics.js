const COST_FACTORS = {
  upload_mb: 0.004,
  storage_mb: 0.0008,
  email_send: 0.0002,
  signature_request: 0.04,
  workflow_run: 0.003,
  api_request: 0.00001,
  pdf_generation: 0.002,
  ai_token_future: 0.00002,
};

export function estimateCost(metricKey, quantity = 0) {
  const factor = COST_FACTORS[metricKey] || 0;
  return Math.round(factor * Number(quantity || 0) * 10000) / 10000;
}

export function estimateTenantCost(usage = {}) {
  return Object.entries(usage).reduce((acc, [key, value]) => {
    acc[key] = estimateCost(key, value);
    return acc;
  }, {});
}

export function totalCost(costMap = {}) {
  return Object.values(costMap).reduce((sum, item) => sum + Number(item || 0), 0);
}
