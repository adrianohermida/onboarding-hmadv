export const SESSION_POLICY = Object.freeze({
  absoluteTimeoutMinutes: 720,
  inactivityTimeoutMinutes: 45,
  rotateOnAuthEvents: true,
  suspiciousSessionThreshold: 3,
});

export function isSessionExpired(lastSeenAtIso) {
  if (!lastSeenAtIso) return true;
  const diffMinutes = (Date.now() - new Date(lastSeenAtIso).getTime()) / 60000;
  return diffMinutes > SESSION_POLICY.inactivityTimeoutMinutes;
}
