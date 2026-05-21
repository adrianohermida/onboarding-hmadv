/**
 * GlobalLoadingLayer — shell-level loading indicator.
 *
 * Shows a progress bar at the top of the viewport during:
 * - Shell route transitions
 * - Module lazy loads
 * - Auth hydration
 *
 * Does NOT block the UI — it's a non-intrusive top bar.
 */
export class GlobalLoadingLayer {
  constructor() {
    this._el     = null;
    this._bar    = null;
    this._active = 0;       // reference count
    this._timer  = null;
  }

  mount() {
    if (this._el) return;

    this._el = document.createElement('div');
    this._el.id = 'shell-loading-layer';
    this._el.style.cssText = `
      position:fixed;top:0;left:0;right:0;height:3px;z-index:9999;
      pointer-events:none;opacity:0;transition:opacity .15s ease;
    `;
    this._bar = document.createElement('div');
    this._bar.style.cssText = `
      height:100%;width:0%;
      background:linear-gradient(90deg, #2E6DA4, #F5A623);
      border-radius:0 3px 3px 0;
      transition:width .4s ease;
    `;
    this._el.appendChild(this._bar);
    document.body.appendChild(this._el);

    return this;
  }

  start() {
    if (!this._el) this.mount();
    this._active++;
    this._el.style.opacity = '1';
    this._bar.style.width = '30%';
    clearTimeout(this._timer);
    // Simulate progress to 80%
    this._timer = setTimeout(() => { this._bar.style.width = '80%'; }, 200);
  }

  finish() {
    this._active = Math.max(0, this._active - 1);
    if (this._active > 0) return;
    clearTimeout(this._timer);
    this._bar.style.width = '100%';
    setTimeout(() => {
      this._el.style.opacity = '0';
      setTimeout(() => { this._bar.style.width = '0%'; }, 200);
    }, 300);
  }

  error() {
    this._active = 0;
    clearTimeout(this._timer);
    this._bar.style.background = '#dc2626';
    this._bar.style.width = '100%';
    setTimeout(() => {
      this._el.style.opacity = '0';
      setTimeout(() => {
        this._bar.style.width = '0%';
        this._bar.style.background = 'linear-gradient(90deg, #2E6DA4, #F5A623)';
      }, 200);
    }, 800);
  }
}

// Singleton
export const loadingLayer = new GlobalLoadingLayer();
export default loadingLayer;
