export class SuspenseBoundary {
  constructor(container) {
    this._container = container;
    this._fallback = null;
  }

  show(message = 'Carregando modulo...') {
    if (!this._container || this._fallback) return;
    this._fallback = document.createElement('div');
    this._fallback.className = 'shell-suspense-boundary';
    this._fallback.innerHTML = `<div class="shell-suspense-message">${message}</div>`;
    this._fallback.style.cssText = [
      'position:absolute',
      'inset:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(255,255,255,0.85)',
      'backdrop-filter:blur(2px)',
      'z-index:30',
    ].join(';');
    this._container.appendChild(this._fallback);
  }

  hide() {
    this._fallback?.remove();
    this._fallback = null;
  }
}

export default SuspenseBoundary;
