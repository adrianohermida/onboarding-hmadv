/**
 * ViewModeSwitcher — reusable view mode switcher component.
 *
 * Modes: 'cliente' | 'advogado' | 'admin'
 *
 * Renders a pill-style switcher into any container element.
 * Emits shell:viewmode-changed event and updates ShellStore.
 *
 * Usage:
 *   import { ViewModeSwitcher } from '../../shell/layout/ViewModeSwitcher.js';
 *   const switcher = new ViewModeSwitcher(containerEl, { modes: ['cliente','admin'] });
 *   switcher.mount();
 */
import { store } from '../state/ShellStore.js';

const MODE_LABELS = {
  cliente:  'Cliente',
  advogado: 'Advogado',
  admin:    'Admin',
};

export class ViewModeSwitcher {
  /**
   * @param {HTMLElement} container
   * @param {{ modes?: string[], onChange?: Function }} opts
   */
  constructor(container, opts = {}) {
    this._container = container;
    this._modes     = opts.modes || ['cliente', 'admin'];
    this._onChange  = opts.onChange || null;
    this._el        = null;
  }

  mount() {
    if (!this._container) return;
    const current = store.getViewMode();

    this._el = document.createElement('div');
    this._el.className = 'view-mode-switcher';
    this._el.style.cssText = 'display:flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:1px;';
    this._render(current);
    this._container.appendChild(this._el);

    // Sync when external changes arrive
    store.subscribe('viewMode', ({ detail }) => {
      this._render(detail.mode || detail.state?.mode || store.getViewMode());
    });

    return this;
  }

  _render(current) {
    if (!this._el) return;
    this._el.innerHTML = this._modes.map(mode => `
      <button
        data-mode="${mode}"
        style="
          padding:5px 14px;border-radius:6px;border:none;cursor:pointer;
          font-size:12px;font-weight:600;transition:background .15s,color .15s;
          ${mode === current
            ? 'background:#fff;color:#1A3A5C;box-shadow:0 1px 4px rgba(0,0,0,.1);'
            : 'background:transparent;color:#64748b;'}
        "
      >${MODE_LABELS[mode] || mode}</button>
    `).join('');

    this._el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        store.setViewMode(mode);
        this._render(mode);
        if (this._onChange) this._onChange(mode);
      });
    });
  }

  setMode(mode) {
    store.setViewMode(mode);
    this._render(mode);
  }

  getMode() { return store.getViewMode(); }

  destroy() {
    this._el?.remove();
  }
}

export default ViewModeSwitcher;
