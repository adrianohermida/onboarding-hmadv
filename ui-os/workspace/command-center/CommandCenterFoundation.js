const MAX_COMMANDS = 3000;

export class CommandCenterFoundation {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      command_id: payload.command_id || `cmd_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      key: payload.key || 'open.search',
      category: payload.category || 'navigation',
      source: payload.source || 'keyboard',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_COMMANDS) this._items.length = MAX_COMMANDS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }

  snapshot(tenant_id = null) {
    const list = this.list(tenant_id);
    return {
      total: list.length,
      navigation: list.filter((entry) => entry.category === 'navigation').length,
      workflow: list.filter((entry) => entry.category === 'workflow').length,
      client: list.filter((entry) => entry.category === 'client').length,
      list,
    };
  }
}

export const commandCenterFoundation = new CommandCenterFoundation();
