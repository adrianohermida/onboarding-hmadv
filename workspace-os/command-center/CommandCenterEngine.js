const MAX_COMMANDS = 4000;

class CommandCenterEngine {
  constructor() {
    this._items = [];
  }

  execute(payload = {}) {
    const item = {
      command_id: payload.command_id || `wcmd_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      key: payload.key || 'workspace.open',
      category: payload.category || 'navigation',
      target: payload.target || null,
      source: payload.source || 'keyboard',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_COMMANDS) this._items.length = MAX_COMMANDS;
    return item;
  }

  search(query = '', tenant_id = 'hmadv') {
    const term = String(query || '').toLowerCase().trim();
    if (!term) return this._items.filter((entry) => entry.tenant_id === tenant_id).slice(0, 25);
    return this._items
      .filter((entry) => entry.tenant_id === tenant_id)
      .filter((entry) => `${entry.key} ${entry.category} ${entry.target || ''}`.toLowerCase().includes(term))
      .slice(0, 25);
  }

  snapshot(tenant_id = 'hmadv') {
    const list = this._items.filter((entry) => entry.tenant_id === tenant_id);
    return {
      total: list.length,
      navigation: list.filter((entry) => entry.category === 'navigation').length,
      workflow: list.filter((entry) => entry.category === 'workflow').length,
      copilot: list.filter((entry) => entry.category === 'copilot').length,
      quick_actions: list.filter((entry) => entry.category === 'quick-action').length,
      list,
    };
  }
}

export const commandCenterEngine = new CommandCenterEngine();
