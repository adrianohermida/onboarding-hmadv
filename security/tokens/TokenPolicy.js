export const TOKEN_POLICY = Object.freeze({
  defaultTtlSeconds: 900,
  singleUse: true,
  hashAlgorithm: 'sha256',
});

export function assertTokenNotExpired(expiresAtIso, message = 'Token expired') {
  if (!expiresAtIso || new Date(expiresAtIso).getTime() <= Date.now()) {
    throw new Error(message);
  }
  return true;
}
