/**
 * NotificationCenter — global notification hub.
 *
 * Sources:
 * - Shell EventBus events (document.approved, debt.updated, etc.)
 * - Supabase realtime (future)
 * - Freshdesk webhooks (future)
 *
 * Renders a notification bell in the header with unread count badge.
 * Dropdown panel shows recent notifications.
 */
import { store } from '../state/ShellStore.js';
import { bus }   from '../../modules/events/EventBus.js';

export class NotificationCenter {
  constructor() {
    this._el        = null;
    this._panel     = null;
    this._isOpen    = false;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  mount(containerSelector = '.header-actions') {
    const container = document.querySelector(containerSelector);
    if (!container || this._el) return;

    this._el = document.createElement('div');
    this._el.className = 'notif-bell';
    this._el.style.cssText = 'position:relative;display:flex;align-items:center;cursor:pointer;';
    this._el.innerHTML = `
      <button id="notif-bell-btn" aria-label="Notificações" style="background:none;border:none;cursor:pointer;padding:6px;color:var(--ink2);position:relative;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span id="notif-badge" style="
          display:none;position:absolute;top:2px;right:2px;
          background:#dc2626;color:#fff;font-size:9px;font-weight:800;
          border-radius:99px;min-width:16px;height:16px;padding:0 4px;
          display:flex;align-items:center;justify-content:center;
        ">0</span>
      </button>
    `;

    // Insert before last child of container
    container.insertBefore(this._el, container.lastChild);

    this._el.querySelector('#notif-bell-btn').addEventListener('click', e => {
      e.stopPropagation();
      this._togglePanel();
    });

    document.addEventListener('click', () => this._closePanel());

    // Subscribe to store changes
    store.subscribe('notifications', ({ detail: { state } }) => {
      this._updateBadge(state.unreadCount);
    });

    // Wire EventBus events → notifications
    this._bindBusEvents();
  }

  // ── Bus → Notifications ────────────────────────────────────────────────────
  _bindBusEvents() {
    const evt = (tipo, icon, makeMsg) => bus.on(tipo, data => {
      store.addNotification({
        type:    tipo,
        icon,
        message: makeMsg(data),
        ts:      new Date().toISOString(),
      });
    });

    evt('document.approved',   '✓', d => `Documento aprovado`);
    evt('document.rejected',   '✗', d => `Documento rejeitado — verifique o motivo`);
    evt('document.uploaded',   '↑', d => `Documento enviado com sucesso`);
    evt('document.created',    '↑', d => `Documento enviado com sucesso`);
    evt('signature.requested', '✍', d => `Assinatura solicitada`);
    evt('signature.completed', '✓', d => `Documento assinado`);
    evt('debt.created',        '+', d => `Nova dívida cadastrada`);
    evt('debt.updated',        '~', d => `Dívida atualizada`);
    evt('onboarding.completed','★', d => `Onboarding concluido`);
    evt('tenant.changed',      'T', d => `Tenant atualizado`);
    evt('auth.changed',        'A', d => `Sessao atualizada`);
    bus.on('notification.created', data => {
      store.addNotification({
        type: data?.type || 'notification.created',
        icon: data?.icon || '•',
        message: data?.message || 'Nova notificacao',
        ts: new Date().toISOString(),
      });
    });
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  _togglePanel() {
    this._isOpen ? this._closePanel() : this._openPanel();
  }

  _openPanel() {
    this._isOpen = true;
    store.markNotificationsRead();

    const { items } = store.get('notifications');
    const content = items.length
      ? items.slice(0, 12).map(n => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid #f1f5f9;">
            <span style="flex-shrink:0;width:24px;height:24px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;">${n.icon || '•'}</span>
            <div>
              <div style="font-size:12px;color:#0f1923;">${n.message}</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${this._fmtTs(n.ts)}</div>
            </div>
          </div>`).join('')
      : '<div style="padding:24px;text-align:center;font-size:13px;color:#94a3b8;">Nenhuma notificação</div>';

    if (this._panel) this._panel.remove();
    this._panel = document.createElement('div');
    this._panel.style.cssText = `
      position:absolute;top:calc(100% + 8px);right:0;width:300px;
      background:#fff;border-radius:12px;border:1px solid #e2e8f0;
      box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:800;overflow:hidden;
    `;
    this._panel.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#0f1923;">Notificações</div>
      ${content}
    `;
    this._panel.addEventListener('click', e => e.stopPropagation());
    this._el.appendChild(this._panel);
  }

  _closePanel() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._panel?.remove();
    this._panel = null;
  }

  _updateBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = count > 9 ? '9+' : String(count);
  }

  _fmtTs(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'agora';
    if (m < 60) return `${m}min atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    return new Date(ts).toLocaleDateString('pt-BR');
  }
}

// Singleton
export const notificationCenter = new NotificationCenter();
export default notificationCenter;
