import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('operational legal shell contract', () => {
  it('keeps persistent header actions for search, legal notifications and alerts', () => {
    const header = read('shell', 'header', 'header.html');

    expect(header).toContain('data-shell-action="global-search"');
    expect(header).toContain('data-shell-action="workspace-panel"');
    expect(header).toContain('aria-label="Notificações"');
    expect(header).toContain('data-shell-action="notifications-panel"');
    expect(header).toContain('shell-notification-count');
    expect(header).toContain('data-shell-action="account-menu-toggle"');
    expect(header).toContain('data-shell-action="open-account-modal"');
    expect(header).toContain('id="sidebar-toggle"');
  });

  it('provides global managers without replacing the shell during route swaps', () => {
    const app = read('js', 'app.js');

    expect(app).toContain('function ensureShellManagers()');
    expect(app).toContain('function openShellDrawer');
    expect(app).toContain('function openShellModal');
    expect(app).toContain('function openGlobalSearchPanel');
    expect(app).toContain('function openNotificationsPanel');
    expect(app).toContain('function openWorkspacePanel');
    expect(app).toContain("title: 'Notificações'");
    expect(app).toContain('Comunicações com registro legal');
    expect(app).toContain('renderLegalNotificationFilters');
    expect(app).toContain('data-legal-filter-kind="types"');
    expect(app).toContain('data-legal-filter-kind="statuses"');
    expect(app).toContain('openLegalNotificationDetail');
    expect(app).toContain('function openAccountModal');
    expect(app).toContain('function getEffectiveIsAdmin');
    expect(app).toContain('function syncShellViewMode');
    expect(app).toContain('function renderAccountModal');
    expect(app).toContain('function renderSidebarToggleButton');
    expect(app).toContain('function renderMobileWorkspaceNav');
    expect(app).toContain('window.addEventListener(VIEW_MODE_EVENT');
    expect(app).toContain("window.shellDrawer = { open: openShellDrawer, close: closeShellDrawer }");
    expect(app).toContain("window.shellModal = { open: openShellModal, close: closeShellModal }");
    expect(app).toContain('currentMain.replaceWith(clonedMain)');
    expect(app).not.toContain('window.location.href = absolute;');
  });

  it('styles the mobile-first legal notification controls', () => {
    const css = read('styles', 'layout.css');

    [
      '.shell-action-btn',
      '.header-user-menu',
      '.account-modal-grid',
      '.shell-side-panel',
      '.shell-panel-item',
      '.shell-legal-filter-grid',
      '.shell-legal-status-grid',
      '.shell-legal-notification-item',
      '.shell-mobile-nav',
      '.shell-workspace-summary',
      '@media (max-width: 1023px)',
    ].forEach(selector => {
      expect(css).toContain(selector);
    });
  });
});
