export class AuditTrail {
  buildEntry({ action, entity, entityId = null, userId = null, tenantId = null, before = null, after = null, origin = 'web' } = {}) {
    return {
      action,
      entity,
      entityId,
      userId,
      tenantId,
      before,
      after,
      origin,
      ipAddress: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      createdAt: new Date().toISOString(),
    };
  }
}

export const auditTrail = new AuditTrail();
export default auditTrail;
