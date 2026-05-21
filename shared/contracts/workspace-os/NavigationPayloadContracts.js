export function normalizeWorkspaceNavigationPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    key: payload.key || 'dashboard',
    title: payload.title || payload.key || 'dashboard',
    href: payload.href || null,
    tab_id: payload.tab_id || null,
    pinned: payload.pinned === true,
  };
}
