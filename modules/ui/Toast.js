/**
 * Toast — sistema de notificações não-bloqueantes
 */
export class Toast {
  static _el = null;

  static _container() {
    if (!this._el) {
      this._el = document.createElement('div');
      this._el.id = 'toast-root';
      this._el.style.cssText = [
        'position:fixed', 'bottom:80px', 'right:20px',
        'z-index:9998', 'display:flex', 'flex-direction:column',
        'gap:8px', 'pointer-events:none', 'max-width:340px',
        '@media(max-width:600px){right:12px;bottom:70px}',
      ].join(';');
      document.body.appendChild(this._el);
    }
    return this._el;
  }

  static show(msg, type = 'info', duration = 4000) {
    const palettes = {
      success: { bg: '#14532d', border: '#16a34a' },
      info:    { bg: '#1e3a5c', border: '#2E6DA4' },
      warn:    { bg: '#78350f', border: '#d97706' },
      error:   { bg: '#7f1d1d', border: '#dc2626' },
    };
    const p = palettes[type] ?? palettes.info;

    const el = document.createElement('div');
    el.style.cssText = `
      background:${p.bg};
      border:1px solid ${p.border};
      color:#fff;
      padding:11px 18px;
      border-radius:10px;
      font-size:13px;
      font-weight:600;
      line-height:1.45;
      box-shadow:0 4px 20px rgba(0,0,0,.3);
      pointer-events:auto;
      animation:toastSlideIn .25s ease;
      transition:opacity .3s,transform .3s;
    `;
    el.textContent = msg;
    this._container().appendChild(el);

    // Injetar animação se não existir
    if (!document.getElementById('toast-keyframes')) {
      const s = document.createElement('style');
      s.id = 'toast-keyframes';
      s.textContent = `
        @keyframes toastSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `;
      document.head.appendChild(s);
    }

    setTimeout(() => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  static success(msg, dur) { this.show(msg, 'success', dur); }
  static error(msg, dur)   { this.show(msg, 'error',   dur); }
  static warn(msg, dur)    { this.show(msg, 'warn',    dur); }
  static info(msg, dur)    { this.show(msg, 'info',    dur); }
}
