const STORAGE_KEY = 'workspace-os:runtime';

class WorkspaceRuntimeEngine {
  constructor() {
    this._state = {
      tabs: [],
      current_context: null,
      history: [],
      filters: {},
      layout: 'multi-panel',
      copilot_state: 'idle',
    };
    this._hydrate();
  }

  update(patch = {}) {
    this._state = { ...this._state, ...patch };
    this._persist();
    return this.snapshot();
  }

  snapshot() {
    return {
      ...this._state,
      open_tabs: this._state.tabs.length,
      generated_at: new Date().toISOString(),
    };
  }

  _hydrate() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') this._state = { ...this._state, ...parsed };
    } catch (_) {}
  }

  _persist() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch (_) {}
  }
}

export const workspaceRuntimeEngine = new WorkspaceRuntimeEngine();
