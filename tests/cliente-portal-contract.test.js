import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules } from '../js/navigation.js';

const root = process.cwd();
const clientKeys = ['meu-caso', 'meus-documentos', 'minhas-dividas', 'meu-plano', 'mensagens', 'ajuda'];

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('portal do cliente contract', () => {
  it('connects the six human client modules to the canonical sidebar', () => {
    const modules = getSidebarModules({ isAdmin: false });
    const routes = getRoutes();

    expect(modules.map(module => module.key)).toEqual(clientKeys);
    modules.forEach(module => {
      expect(module.roles).toContain('cliente');
      expect(routes[module.key]?.title).toBeTruthy();
    });
  });

  it('ships client pages mounted in the shared shell', () => {
    clientKeys.forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('main class="page-content"');
      expect(html).toContain('../js/app.js?v=20260521p');
    });
  });

  it('keeps client portal copy simple and backed by existing operational routes', () => {
    const controller = readFile('modules', 'cliente', 'PortalClientePage.js');
    const styles = readFile('styles', 'components.css');

    ['CaseService', 'DebtService', 'DocumentService'].forEach(symbol => {
      expect(controller).toContain(symbol);
    });
    ['documentos.html', 'dividas.html', 'suporte.html', 'onboarding-v2.html', 'financial-dashboard.html'].forEach(route => {
      expect(controller).toContain(route);
    });
    ['cliente-next-action', 'cliente-kpis', 'cliente-list-item', 'cliente-faq'].forEach(cssClass => {
      expect(styles).toContain(cssClass);
    });
  });
});
