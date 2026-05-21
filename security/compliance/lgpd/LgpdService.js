export class LgpdService {
  buildExportRequest({ userId, tenantId, requestedAt = new Date().toISOString() }) {
    return { type: 'export', userId, tenantId, requestedAt, status: 'pending' };
  }

  buildDeleteRequest({ userId, tenantId, requestedAt = new Date().toISOString() }) {
    return { type: 'delete', userId, tenantId, requestedAt, status: 'pending' };
  }

  buildAnonymizeRequest({ userId, tenantId, requestedAt = new Date().toISOString() }) {
    return { type: 'anonymize', userId, tenantId, requestedAt, status: 'pending' };
  }
}

export const lgpdService = new LgpdService();
export default lgpdService;
