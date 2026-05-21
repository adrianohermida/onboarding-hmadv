import { bus } from '../events/EventBus.js';

const REQUIRED_FIELDS = [
  'consentType',
  'consentVersion',
  'tenantId',
  'userId',
  'ipAddress',
  'userAgent',
  'acceptedAt',
];

function validateConsentPayload(payload = {}) {
  const missing = REQUIRED_FIELDS.filter(field => !payload[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

export class ConsentEngine {
  constructor() {
    this._history = [];
  }

  recordConsent(payload = {}) {
    const check = validateConsentPayload(payload);
    if (!check.valid) {
      const error = new Error(`Invalid consent payload. Missing: ${check.missing.join(', ')}`);
      bus.emit('consent.error', { message: error.message, missing: check.missing });
      throw error;
    }

    const entry = {
      id: payload.id || `${payload.userId}:${payload.consentType}:${Date.now()}`,
      consentType: payload.consentType,
      consentVersion: payload.consentVersion,
      tenantId: payload.tenantId,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      acceptedAt: payload.acceptedAt,
      revokedAt: null,
      legalBasis: payload.legalBasis || 'consent',
      treatmentPurpose: payload.treatmentPurpose || 'not-informed',
      meta: payload.meta || {},
    };

    this._history.push(entry);
    bus.emit('consent.recorded', entry);
    return entry;
  }

  revokeConsent({ id, revokedAt = new Date().toISOString(), reason = 'user-request' } = {}) {
    const entry = this._history.find(item => item.id === id);
    if (!entry) return null;
    entry.revokedAt = revokedAt;
    entry.revokeReason = reason;
    bus.emit('consent.revoked', { id, revokedAt, reason, tenantId: entry.tenantId, userId: entry.userId });
    return entry;
  }

  getHistory({ userId, tenantId } = {}) {
    return this._history.filter(item => {
      if (userId && item.userId !== userId) return false;
      if (tenantId && item.tenantId !== tenantId) return false;
      return true;
    });
  }
}

export const consentEngine = new ConsentEngine();
export default consentEngine;
