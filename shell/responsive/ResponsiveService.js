import { store } from '../state/ShellStore.js';

const MOBILE_QUERY = '(max-width: 1023px)';

export class ResponsiveService {
  constructor() {
    this._mql = null;
    this._onChange = null;
  }

  bind() {
    if (this._mql) return;
    this._mql = window.matchMedia(MOBILE_QUERY);
    this._onChange = () => {
      if (!this._mql.matches) {
        store.setSidebarOpen(false);
      }
      document.body.classList.toggle('shell-mobile', this._mql.matches);
      document.body.classList.toggle('shell-desktop', !this._mql.matches);
    };
    this._onChange();
    this._mql.addEventListener('change', this._onChange);
  }

  unbind() {
    if (!this._mql || !this._onChange) return;
    this._mql.removeEventListener('change', this._onChange);
    this._mql = null;
    this._onChange = null;
  }
}

export const responsiveService = new ResponsiveService();
export default responsiveService;
