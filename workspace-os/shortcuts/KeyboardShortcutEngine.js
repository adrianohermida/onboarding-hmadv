import { bus } from '../../modules/events/EventBus.js';

class KeyboardShortcutEngine {
  constructor() {
    this._mounted = false;
    this._listener = null;
  }

  mount() {
    if (this._mounted || typeof window === 'undefined') return;
    this._listener = (event) => {
      const cmdOrCtrl = event.metaKey || event.ctrlKey;
      const key = String(event.key || '').toLowerCase();
      if (cmdOrCtrl && key === 'k') {
        event.preventDefault();
        bus.emit('workspace.command-center.toggle', { source: 'shortcut', shortcut: 'ctrl+k' });
      }
      if (cmdOrCtrl && key === 'p') bus.emit('workspace.quick-actions.open', { source: 'shortcut', shortcut: 'ctrl+p' });
      if (cmdOrCtrl && key === 'i') bus.emit('workspace.inspector.toggle', { source: 'shortcut', shortcut: 'ctrl+i' });
    };
    window.addEventListener('keydown', this._listener);
    this._mounted = true;
  }

  unmount() {
    if (!this._mounted || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this._listener);
    this._listener = null;
    this._mounted = false;
  }

  snapshot() {
    return {
      command_center: 'ctrl+k',
      quick_actions: 'ctrl+p',
      inspector: 'ctrl+i',
      mounted: this._mounted,
      generated_at: new Date().toISOString(),
    };
  }
}

export const keyboardShortcutEngine = new KeyboardShortcutEngine();
