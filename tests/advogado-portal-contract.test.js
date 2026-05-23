import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules } from '../js/navigation.js';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();

const lawyerKeys = [
  'painel',
  'clientes', 'processos', 'publicacoes', 'prazos', 'tarefas', 'agenda', 'audiencias',
  'financeiro', 'custas-processuais',
  'mensagens', 'onboarding-v2', 'suporte', 'partes',
  'analytics', 'ai-copilot', 'gestao',
];

const crudKeys = [
  'clientes', 'partes', 'documentos', 'planos', 'processos', 'movimentacoes',
  'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual',
  'relacoes-processuais', 'tpu', 'orgaos-judiciarios', 'serventias', 'tarefas', 'agenda',
  'mensagens', 'financeiro',
];

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

const shellVersion = readFile('js', 'app.js').match(/const SHELL_VERSION = '([^']+)'/)?.[1] ?? 'missing';
const shellScript = `../js/app.js?v=${shellVersion}`;

describe('portal do advogado contract', () => {
  it('connects the lawyer workspace modules to the canonical admin sidebar', () => {
    const adminModules = getSidebarModules({ isAdmin: true }).map(module => module.key);
    const routes = getRoutes();

    expect(adminModules).toEqual(lawyerKeys);
    lawyerKeys.forEach(key => {
      expect(routes[key]).toBeTruthy();
      expect(routes[key].title).toBeTruthy();
    });
    ['platform-os', 'ui-os', 'workspace-os', 'billing-os'].forEach(key => {
      expect(routes[key]).toBeTruthy();
      expect(adminModules).not.toContain(key);
    });
  });

  it('ships authenticated pages for every core admin route', () => {
    ['painel', 'clientes', 'partes', 'processos', 'publicacoes', 'audiencias', 'prazos',
     'custas-processuais', 'financeiro-processual', 'tarefas', 'agenda', 'mensagens', 'financeiro'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain(shellScript);
    });
  });

  it('ships support and sub-pages mounted inside the shared shell', () => {
    ['suporte', 'onboarding-v2', 'financial-dashboard', 'onboarding'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain(shellScript);
    });
  });

  it('ships shell-mounted enterprise pages for the operating system modules', () => {
    ['analytics', 'ai-copilot', 'gestao', 'experiencia-cliente', 'financeiro-inteligencia',
     'operacoes-juridicas', 'compliance', 'platform-os', 'ui-os', 'workspace-os', 'billing-os'].forEach(key => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('main class="page-content"');
      expect(html).toContain(shellScript);
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

  it('reads legal admin modules from the real Supabase source tables', () => {
    const service = readFile('modules', 'advogado', 'RegistroAdvogadoService.js');

    expect(service).toContain("processos: { schema: 'judiciario', table: 'processos' }");
    expect(service).toContain("publicacoes: { schema: 'judiciario', table: 'publicacoes' }");
    expect(service).toContain("audiencias: { schema: 'judiciario', table: 'audiencias' }");
    expect(service).toContain("prazos: { schema: 'judiciario', table: 'prazo_tarefa' }");
    expect(service).toContain("documentos: { schema: 'public', table: 'portal_documentos'");
    expect(service).toContain("supabase.schema('judiciario')");
    expect(service).toContain('listSchemaModuleRecords');
  });
});
