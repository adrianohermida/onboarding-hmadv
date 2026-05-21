/**
 * Shell — gerencia o layout autenticado: sidebar mobile, overlay, safe-area
 */
export class Shell {
  constructor() {
    this._isOpen  = false;
    this._overlay = null;
    this._sidebar = null;
    this._toggle  = null;
  }

  init() {
    this._sidebar = document.querySelector('.sidebar, aside.sidebar');
    this._toggle  = document.querySelector('#sidebar-toggle, .sidebar-toggle');
    this._createOverlay();
    this._bindEvents();
    this._applySafeArea();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize(), { passive: true });

    // Marca página ativa no nav
    this._markActivePage();
  }

  // ── Overlay ────────────────────────────────────────────────────────────────
  _createOverlay() {
    this._overlay = document.createElement('div');
    this._overlay.id = 'sidebar-overlay';
    this._overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.55);
      z-index:48; display:none;
      backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
      transition:opacity .25s;
    `;
    this._overlay.addEventListener('click', () => this.close());
    document.body.insertBefore(this._overlay, document.body.firstChild);
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  _bindEvents() {
    // Toggle via botão hamburger
    if (this._toggle) {
      this._toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });

    // Swipe-to-close no mobile
    let startX = 0;
    document.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -60 && this._isOpen) this.close();
    }, { passive: true });
  }

  _handleResize() {
    if (window.innerWidth >= 1024 && this._isOpen) this.close();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  toggle() { this._isOpen ? this.close() : this.open(); }

  open() {
    this._isOpen = true;
    if (this._sidebar)  this._sidebar.classList.add('sidebar--open');
    if (this._overlay)  { this._overlay.style.display = 'block'; requestAnimationFrame(() => { this._overlay.style.opacity = '1'; }); }
    if (this._toggle)   this._toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this._isOpen = false;
    if (this._sidebar)  this._sidebar.classList.remove('sidebar--open');
    if (this._overlay)  { this._overlay.style.opacity = '0'; setTimeout(() => { if (this._overlay) this._overlay.style.display = 'none'; }, 250); }
    if (this._toggle)   this._toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // ── Safe area (iOS notch) ─────────────────────────────────────────────────
  _applySafeArea() {
    const meta = document.querySelector('meta[name=viewport]');
    if (meta && !meta.content.includes('viewport-fit')) {
      meta.content += ', viewport-fit=cover';
    }
  }

  // ── Active page highlight ─────────────────────────────────────────────────
  _markActivePage() {
    const page = location.pathname.split('/').pop().replace('.html', '');
    document.querySelectorAll('.nav-link[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });
  }
}
