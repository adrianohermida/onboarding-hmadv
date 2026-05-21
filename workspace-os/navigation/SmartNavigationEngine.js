class SmartNavigationEngine {
  constructor() {
    this._history = [];
    this._pinned = [];
  }

  navigate(payload = {}) {
    const item = {
      key: payload.key || 'dashboard',
      title: payload.title || payload.key || 'dashboard',
      href: payload.href || null,
      timestamp: new Date().toISOString(),
    };
    this._history.unshift(item);
    if (this._history.length > 200) this._history.length = 200;
    return item;
  }

  pin(item) {
    if (!item || !item.key) return;
    if (this._pinned.some((entry) => entry.key === item.key)) return;
    this._pinned.push({ ...item, pinned_at: new Date().toISOString() });
  }

  snapshot() {
    return {
      breadcrumbs: this._history.slice(0, 5).reverse(),
      history: [...this._history],
      recent_items: this._history.slice(0, 10),
      pinned_items: [...this._pinned],
      tab_persistence_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const smartNavigationEngine = new SmartNavigationEngine();
