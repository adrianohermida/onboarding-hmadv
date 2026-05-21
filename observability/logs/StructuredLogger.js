import { normalizeLogPayload } from '../../shared/contracts/observability/LogContracts.js';

const MAX_LOGS = 1000;

export class StructuredLogger {
  constructor() {
    this._entries = [];
  }

  log(payload = {}) {
    const entry = normalizeLogPayload(payload);
    this._entries.unshift(entry);
    if (this._entries.length > MAX_LOGS) this._entries.length = MAX_LOGS;
    return entry;
  }

  classifyError(error, source = 'runtime') {
    const text = String(error?.message || error || '').toLowerCase();

    if (text.includes('auth') || text.includes('token') || text.includes('sess')) return 'auth_error';
    if (text.includes('upload') || text.includes('storage') || text.includes('signed url')) return 'upload_error';
    if (text.includes('workflow')) return 'workflow_error';
    if (text.includes('event')) return 'event_error';
    if (text.includes('tenant')) return 'tenant_error';
    if (text.includes('valid')) return 'validation_error';
    if (text.includes('freshdesk') || text.includes('resend') || text.includes('autentique') || text.includes('webhook')) return 'integration_error';
    if (source === 'security') return 'security_error';
    return 'runtime_error';
  }

  list() {
    return [...this._entries];
  }
}

export const structuredLogger = new StructuredLogger();
