export const ALERT_RULES = Object.freeze({
  tokenSpike: { threshold: 20, windowMinutes: 5 },
  loginBruteforce: { threshold: 15, windowMinutes: 5 },
  webhookFailures: { threshold: 8, windowMinutes: 10 },
});

export function getAlertRule(name) {
  return ALERT_RULES[name] || null;
}
