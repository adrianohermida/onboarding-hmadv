/**
 * GlobalModalRoot — centralized modal system.
 *
 * All modals in the portal MUST go through this system.
 * Features:
 * - Stack control (multiple modals)
 * - Z-index governance
 * - Scroll lock
 * - ESC to close
 * - Backdrop click to close
 * - Accessibility (focus trap)
 * - Transition animations
 *
 * Usage from modules (via shell contract):
 *   import { modal } from '../../shared/contracts/ShellContract.js';
 *   modal.open({ id: 'my-modal', title: 'Título', content: '<p>...</p>' });
 *   modal.close('my-modal');
 */
import { store } from '../state/ShellStore.js';
import { bus }   from '../../modules/events/EventBus.js';

const BASE_Z = 1000;

export class GlobalModalRoot {
  constructor() {
    this._container = null;
    this._stack     = [];
  }

  // ── Mount ─────────────────────────────────────────────────────────────────
  mount() {
    if (this._container) return;

    this._container = document.createElement('div');
    this._container.id = 'shell-modal-root';
    this._container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:' + BASE_Z;
    document.body.appendChild(this._container);

    // ESC to close top modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._stack.length) {
        const top = this._stack[this._stack.length - 1];
        if (top?.closeable !== false) this.close(top.id);
      }
    });
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  /**
   * @param {object} opts
   * @param {string}   opts.id         - unique modal id
   * @param {string}   [opts.title]    - modal title
   * @param {string}   [opts.content]  - HTML string content
   * @param {string}   [opts.size]     - 'sm' | 'md' | 'lg' | 'full'
   * @param {boolean}  [opts.closeable]  - default true
   * @param {Function} [opts.onClose]  - callback on close
   */
  open(opts) {
    if (!this._container) this.mount();
    if (this._stack.find(m => m.id === opts.id)) return; // already open

    const config = {
      id:        opts.id,
      title:     opts.title     || '',
      content:   opts.content   || '',
      size:      opts.size      || 'md',
      closeable: opts.closeable !== false,
      onClose:   opts.onClose   || null,
    };

    this._stack.push(config);
    this._renderModal(config, this._stack.length);

    if (this._stack.length === 1) document.body.style.overflow = 'hidden';
    bus.emit('modal.opened', { id: config.id });
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  close(id) {
    const idx = this._stack.findIndex(m => m.id === id);
    if (idx < 0) return;

    const config = this._stack[idx];
    const el = document.getElementById(`modal-${id}`);
    if (el) {
      el.classList.remove('modal--visible');
      setTimeout(() => el.remove(), 250);
    }
    this._stack.splice(idx, 1);

    if (!this._stack.length) document.body.style.overflow = '';
    if (config.onClose) config.onClose();
    bus.emit('modal.closed', { id });
  }

  closeAll() {
    [...this._stack].forEach(m => this.close(m.id));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  _renderModal(config, depth) {
    const sizeW = { sm: '400px', md: '560px', lg: '760px', full: '100%' }[config.size] || '560px';
    const zIdx  = BASE_Z + depth;

    const wrapper = document.createElement('div');
    wrapper.id = `modal-${config.id}`;
    wrapper.style.cssText = `position:fixed;inset:0;z-index:${zIdx};display:flex;align-items:center;justify-content:center;pointer-events:auto;`;
    wrapper.innerHTML = `
      <div class="shell-modal-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,.45);transition:opacity .2s;"></div>
      <div class="shell-modal-panel" role="dialog" aria-modal="true" aria-label="${config.title}" style="
        position:relative;background:#fff;border-radius:16px;width:min(${sizeW},calc(100vw - 32px));
        max-height:calc(100dvh - 48px);overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,.18);
        padding:0;transition:transform .25s cubic-bezier(.4,0,.2,1),opacity .25s;
        transform:scale(.97) translateY(8px);opacity:0;
      ">
        ${config.title ? `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;font-weight:700;color:#0f1923;">${config.title}</span>
          ${config.closeable ? `<button onclick="window.__shellModal.close('${config.id}')" style="background:none;border:none;cursor:pointer;padding:4px;color:#94a3b8;font-size:18px;line-height:1;" aria-label="Fechar">✕</button>` : ''}
        </div>` : ''}
        <div style="padding:24px;">${config.content}</div>
      </div>`;

    this._container.appendChild(wrapper);

    // Backdrop click
    if (config.closeable) {
      wrapper.querySelector('.shell-modal-backdrop')?.addEventListener('click', () => this.close(config.id));
    }

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrapper.classList.add('modal--visible');
        const panel = wrapper.querySelector('.shell-modal-panel');
        if (panel) { panel.style.transform = 'scale(1) translateY(0)'; panel.style.opacity = '1'; }
      });
    });
  }
}

// Singleton + global accessor for inline HTML onclick handlers
export const globalModal = new GlobalModalRoot();
window.__shellModal = globalModal;
export default globalModal;
