import { integrationRateLimitPolicy } from './rate-limits/RateLimitPolicy.js';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const seenSignatures = new Map();

export function validateWebhookSignature(received, expected) {
  if (!expected) return true;
  return !!received && received === expected;
}

export function validateWebhookTimestamp(timestamp) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() - ts) <= REPLAY_WINDOW_MS;
}

export function protectAgainstReplay(signature, timestamp) {
  const key = `${signature}:${timestamp}`;
  const prev = seenSignatures.get(key);
  if (prev) return false;
  seenSignatures.set(key, Date.now());
  return true;
}

export function validateWebhookSecurity({ provider, tenant_id, signature, expectedSignature, timestamp }) {
  const rate = integrationRateLimitPolicy.check(provider, tenant_id);
  if (!rate.allowed) return { valid: false, reason: 'rate_limit_exceeded', rate };

  if (!validateWebhookSignature(signature, expectedSignature)) {
    return { valid: false, reason: 'signature_invalid', rate };
  }

  if (!validateWebhookTimestamp(timestamp)) {
    return { valid: false, reason: 'timestamp_invalid', rate };
  }

  if (!protectAgainstReplay(signature, timestamp)) {
    return { valid: false, reason: 'replay_detected', rate };
  }

  return { valid: true, rate };
}
