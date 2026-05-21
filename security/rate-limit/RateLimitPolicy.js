export const RATE_LIMITS = Object.freeze({
  loginPerMinute: 8,
  tokenIssuePerMinute: 12,
  uploadPerMinute: 20,
  webhookPerMinute: 60,
});

export function getRateLimit(key) {
  return RATE_LIMITS[key] || null;
}
