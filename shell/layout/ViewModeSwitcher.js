const VIEW_MODE_KEY = 'portal:view-mode';
const VIEW_MODE_EVENT = 'portal:view-mode-changed';

const MODE_LABELS = {
  cliente:  'Cliente',
  advogado: 'Advogado',
  admin:    'Admin',
};

function normalizeMode(mode) {
  return mode === 'admin' || mode === 'advogado' ? mode : 'cliente';
}

function getStoredMode() {
  try {
    return normalizeMode(sessionStorage.getItem(VIEW_MODE_KEY) || 'cliente');
  } catch (_) {
    return 'cliente';
  }
}

function setStoredMode(mode) {
  const next = normalizeMode(mode);
  try {
    sessionStorage.setItem(VIEW_MODE_KEY, next);
  } catch (_) {}
  window.dispatchEvent(new CustomEvent(VIEW_MODE_EVENT, { detail: { mode: next, source: 'shell-switcher' } }));
  return next;
}

export class ViewModeSwitcher {
  /**
   * @param {HTMLElement} container
   * @param {{ modes?: string[], onChange?: Function }} opts
   */
  constructor(container, opts = {}) {
    this._container = container;
    this._modes     = opts.modes || ['cliente', 'advogado', 'admin'];
    this._onChange  = opts.onChange || null;
    this._el        = null;
  }

  mount() {
    if (!this._container) return;
    const current = getStoredMode();

    this._el = document.createElement('div');
    this._el.className = 'portal-mode-switch';
    this._render(current);
    this._container.appendChild(this._el);

    this._listener = event => this._render(event?.detail?.mode || getStoredMode());
    window.addEventListener(VIEW_MODE_EVENT, this._listener);

    return this;
  }

  _render(current) {
    if (!this._el) return;
    this._el.innerHTML = this._modes.map(mode => `
      <button
        data-mode="${mode}"
        class="portal-mode-btn${mode === current ? ' portal-mode-btn-active' : ''}"
        type="button"
        aria-pressed="${mode === current ? 'true' : 'false'}"
      >${MODE_LABELS[mode] || mode}</button>
    `).join('');

    this._el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = setStoredMode(btn.dataset.mode);
        this._render(mode);
        if (this._onChange) this._onChange(mode);
      });
    });
  }

  setMode(mode) {
    this._render(setStoredMode(mode));
  }

  getMode() { return getStoredMode(); }

  destroy() {
    if (this._listener) window.removeEventListener(VIEW_MODE_EVENT, this._listener);
    this._el?.remove();
  }
}

export default ViewModeSwitcher;
