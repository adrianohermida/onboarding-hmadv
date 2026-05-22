import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules } from '../js/navigation.js';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();
const lawyerKeys = ['painel', 'clientes', 'partes', 'documentos', 'planos', 'processos', 'movimentacoes', 'publicacoes', 'mensagens', 'audiencias', 'prazos', 'onboarding-v2', 'financial-dashboard', 'suporte', 'onboarding', 'custas-processuais', 'financeiro-processual', 'ai-copilot', 'relacoes-processuais', 'experiencia-cliente', 'tpu', 'financeiro-inteligencia', 'orgaos-judiciarios', 'operacoes-juridicas', 'serventias', 'compliance', 'tarefas', 'platform-os', 'agenda', 'ui-os', 'financeiro', 'workspace-os', 'analytics', 'billing-os'];
const crudKeys = ['clientes', 'partes', 'documentos', 'planos', 'processos', 'movimentacoes', 'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual', 'relacoes-processuais', 'tpu', 'orgaos-judiciarios', 'serventias', 'tarefas', 'agenda', 'mensagens', 'financeiro'];

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('portal do advogado contract', () => {
  it('connects the lawyer workspace modules to the canonical admin sidebar', () => {
    const adminModules = getSidebarModules({ isAdmin: true }).map(module => module.key);
    const routes = getRoutes();

    expect(adminModules).toEqual(lawyerKeys);
    lawyerKeys.forEach(key => {
      expect(routes[key]).toBeTruthy();
      expect(routes[key].title).toBeTruthy();
    });
  });

  it('ships authenticated pages for every new lawyer route', () => {
    ['painel', 'clientes', 'partes', 'planos', 'processos', 'movimentacoes', 'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual', 'relacoes-processuais', 'tpu', 'orgaos-judiciarios', 'serventias', 'tarefas', 'agenda', 'mensagens', 'financeiro'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('data-advogado-module-host');
      expect(html).toContain('../js/app.js?v=20260521p');
      expect(html).toContain(`bootAdvogadoPage('${key}')`);
    });
  });

  it('ships case-management pages that stay mounted inside the shared shell', () => {
    ['onboarding-v2', 'financial-dashboard', 'suporte', 'onboarding'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('../js/app.js?v=20260521p');
    });
  });

  it('ships shell-mounted enterprise pages for the new operating system modules', () => {
    ['analytics', 'ai-copilot', 'experiencia-cliente', 'financeiro-inteligencia', 'operacoes-juridicas', 'compliance', 'platform-os', 'ui-os', 'workspace-os', 'billing-os'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('main class="page-content"');
      expect(html).toContain('../js/app.js?v=20260521p');
    });
  });

  it('defines operational CRUD configuration for all lawyer CRUD modules', () => {
    crudKeys.forEach(key => {
      const config = ADVOGADO_MODULES[key];

      expect(config).toBeTruthy();
      expect(config.title).toBeTruthy();
      expect(config.primaryField).toBeTruthy();
      expect(config.status.length).toBeGreaterThanOrEqual(4);
      expect(config.fields.length).toBeGreaterThanOrEqual(5);
      expect(config.fields.some(field => field.required)).toBe(true);
    });
  });

  it('keeps CRUD, timeline, filters, pagination and responsive hooks in the page controller', () => {
    const controller = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');
    const service = readFile('modules', 'advogado', 'RegistroAdvogadoService.js');
    const styles = readFile('styles', 'components.css');

    ['saveAdvogadoRecord', 'archiveAdvogadoRecord', 'deleteAdvogadoRecord', 'listAdvogadoTimeline', 'listAdvogadoAudit', 'filterAdvogadoRecords', 'paginateAdvogadoRecords'].forEach(symbol => {
      expect(`${controller}\n${service}`).toContain(symbol);
    });
    expect(service).toContain('portal_operational_records');
    expect(service).toContain('portal_operational_record_audit');
    expect(controller).toContain('AdminService.getClients');
    expect(controller).toContain('resetClientJourney');
    expect(controller).toContain('Gestão do caso');
    expect(controller).toContain('data-advogado-filter="query"');
    expect(controller).toContain('data-advogado-page="next"');
    expect(controller).toContain('data-action="detail"');
    expect(styles).toContain('@media (max-width: 680px)');
    expect(styles).toContain('.advogado-record-card');
    expect(styles).toContain('.advogado-detail-row');
    expect(styles).toContain('.advogado-flow-pill');
  });
});
