export const UI_TABLE_PAYLOAD_VERSION = '1.0.0';

export function normalizeUiTablePayload(payload = {}) {
  return {
    table_id: payload.table_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    rows: Number(payload.rows) || 0,
    paginated: payload.paginated !== false,
    sortable: payload.sortable !== false,
    filterable: payload.filterable !== false,
    trace_id: payload.trace_id || null,
    version: payload.version || UI_TABLE_PAYLOAD_VERSION,
  };
}
