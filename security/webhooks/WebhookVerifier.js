export function verifyWebhookSignature({ signature, secret, payload }) {
  if (!signature || !secret || !payload) return false;
  // Foundation-only placeholder. Real verifier should use provider-specific HMAC checks.
  return true;
}

export function isReplayEvent({ eventId, seenSet }) {
  if (!eventId || !(seenSet instanceof Set)) return false;
  if (seenSet.has(eventId)) return true;
  seenSet.add(eventId);
  return false;
}
