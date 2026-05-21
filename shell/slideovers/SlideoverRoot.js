/**
 * SlideoverRoot — right-panel slideovers for the portal.
 *
 * Used for:
 * - Document viewer/reviewer
 * - Debt detail panel
 * - Financial review
 * - PDF preview
 * - Timeline panels
 *
 * Usage via contract:
 *   import { slideover } from '../../shared/contracts/ShellContract.js';
 *   slideover.open({ id: 'doc-viewer', title: 'Ver Documento', content: html, width: '480px' });
 */
import { bus } from '../../modules/events/EventBus.js';

const Z_SLIDEOVER = 900;

export class SlideoverRoot {
  constructor() {
    this._container   = null;
    this._backdrop    = null;
    this._stack       = [];
  }

  mount() {
    if (this._container) return;

    // Backdrop
    this._backdrop = document.createElement('div');
    this._backdrop.id = 'shell-slideover-backdrop';
    this._backdrop.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:${Z_SLIDEOVER - 1};
      opacity:0;pointer-events:none;transition:opacity .25s ease;
    `;
    this._backdrop.addEventListener('click', () => {
      const top = this._stack[this._stack.length - 1];
      if (top?.closeable !== false) this.close(top.id);
    });
    document.body.appendChild(this._backdrop);

    // Container
    this._container = document.createElement('div');
    this._container.id = 'shell-slideover-root';
    this._container.style.cssText = `position:fixed;top:0;right:0;height:100dvh;z-index:${Z_SLIDEOVER};pointer-events:none;display:flex;`;
    document.body.appendChild(this._container);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._stack.length) {
        const top = this._stack[this._stack.length - 1];
        if (top?.closeable !== false) this.close(top.id);
      }
    });
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  open(opts) {
    if (!this._container) this.mount();
    if (this._stack.find(s => s.id === opts.id)) {
      this._updateContent(opts.id, opts.content);
      return;
    }

    const config = {
      id:        opts.id,
      title:     opts.title     || '',
      content:   opts.content   || '',
      width:     opts.width     || '480px',
      closeable: opts.closeable !== false,
      onClose:   opts.onClose   || null,
    };

    this._stack.push(config);
    this._renderPanel(config);

    this._backdrop.style.opacity = '1';
    this._backdrop.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    bus.emit('slideover.opened', { id: config.id });
  }

  close(id) {
    const idx = this._stack.findIndex(s => s.id === id);
    if (idx < 0) return;

    const config = this._stack[idx];
    const el = document.getElementById(`slideover-${id}`);
    if (el) {
      el.style.transform = 'translateX(100%)';
      setTimeout(() => el.remove(), 280);
    }
    this._stack.splice(idx, 1);

    if (!this._stack.length) {
      this._backdrop.style.opacity = '0';
      this._backdrop.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }
    if (config.onClose) config.onClose();
    bus.emit('slideover.closed', { id });
  }

  closeAll() {
    [...this._stack].forEach(s => this.close(s.id));
  }

  _updateContent(id, content) {
    const el = document.getElementById(`slideover-${id}`);
    const body = el?.querySelector('.slideover-body');
    if (body) body.innerHTML = content;
  }

  _renderPanel(config) {
    const panel = document.createElement('div');
    panel.id = `slideover-${config.id}`;
    panel.style.cssText = `
      width:min(${config.width}, 100vw);height:100dvh;background:#fff;
      box-shadow:-8px 0 32px rgba(0,0,0,.12);overflow:hidden;
      display:flex;flex-direction:column;pointer-events:auto;
      transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);
      position:absolute;right:0;top:0;
    `;
    panel.innerHTML = `
      <div class="slideover-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e8f0;flex-shrink:0;">
        <span style="font-size:15px;font-weight:700;color:#0f1923;">${config.title}</span>
        ${config.closeable ? `<button onclick="window.__shellSlideover.close('${config.id}')" style="background:none;border:none;cursor:pointer;padding:4px;color:#94a3b8;font-size:20px;line-height:1;" aria-label="Fechar">✕</button>` : ''}
      </div>
      <div class="slideover-body" style="flex:1;overflow-y:auto;overflow-x:hidden;">${config.content}</div>
    `;
    this._container.appendChild(panel);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      panel.style.transform = 'translateX(0)';
    }));
  }
}

// Singleton
export const globalSlideover = new SlideoverRoot();
window.__shellSlideover = globalSlideover;
export default globalSlideover;
