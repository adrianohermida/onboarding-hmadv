import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules } from '../js/navigation.js';

const root = process.cwd();
const clientKeys = ['meu-caso', 'meus-documentos', 'minhas-dividas', 'meu-plano', 'mensagens', 'ajuda', 'onboarding-v2', 'financial-dashboard', 'suporte', 'onboarding'];
const usefulClientFlowMarkers = {
  'meu-caso': ['Seu caminho no portal', 'Resumo tranquilo'],
  'meus-documentos': ['Lista de documentos', 'Enviar documento'],
  'minhas-dividas': ['Seus credores', 'Adicionar dívida'],
  'meu-plano': ['Proposta consolidada', 'Diagnóstico financeiro'],
  mensagens: ['Comunicação com o escritório', 'Abrir atendimento'],
  ajuda: ['Dúvidas frequentes', 'Falar com o escritório'],
  'onboarding-v2': ['Sua Jornada de Superendividamento', 'Seu Diagnóstico Financeiro'],
  'financial-dashboard': ['Diagnóstico Financeiro', 'Salvar diagnóstico'],
  suporte: ['Meus Chamados', 'Canais de Atendimento'],
  onboarding: ['Formulário de Superendividamento', 'Continuar etapa atual'],
};

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('portal do cliente contract', () => {
  it('connects the client workspace modules to the canonical sidebar', () => {
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

  it('keeps every client sidebar flow connected to useful business content', () => {
    const controller = readFile('modules', 'cliente', 'PortalClientePage.js');
    const directPages = new Set(['onboarding-v2', 'financial-dashboard', 'suporte', 'onboarding']);

    Object.entries(usefulClientFlowMarkers).forEach(([key, markers]) => {
      const content = directPages.has(key)
        ? readFile('pages', `${key}.html`)
        : controller;

      markers.forEach(marker => {
        expect(content).toContain(marker);
      });
    });
  });
});
