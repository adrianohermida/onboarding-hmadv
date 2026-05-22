import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules, PORTAL_MODULES } from '../js/navigation.js';

const expectedClientSidebarKeys = [
  'visao-geral', 'meus-casos', 'meus-processos', 'honorarios',
  'meus-documentos', 'atendimento', 'marketplace', 'configuracoes',
];

const expectedAdminRelacionamento = {
  mensagens: { menuLabel: 'Mensagens', adminSidebarSectionLabel: 'Relacionamento' },
  suporte:   { menuLabel: 'Suporte',   adminSidebarSectionLabel: 'Relacionamento' },
};

const expectedAdminOperations = {
  clientes:              { title: 'Clientes',              menuLabel: 'Clientes' },
  processos:             { title: 'Processos',             menuLabel: 'Processos' },
  audiencias:            { title: 'Audiências',            menuLabel: 'Audiências' },
  publicacoes:           { title: 'Publicações',           menuLabel: 'Publicações' },
  prazos:                { title: 'Prazos',                menuLabel: 'Prazos' },
  'custas-processuais':  { title: 'Custas',                menuLabel: 'Custas' },
};

describe('navigation contract', () => {
  it('exposes the client portal modules in the expected order', () => {
    const modules = getSidebarModules({ isAdmin: false });

    expect(modules.map(module => module.key)).toEqual(expectedClientSidebarKeys);
    expect(new Set(modules.map(module => module.key)).size).toBe(expectedClientSidebarKeys.length);
    expect(modules.every(module => module.visible)).toBe(true);
  });

  it('keeps routes and sidebar modules sourced from the same module registry', () => {
    const routes = getRoutes();
    const moduleKeys = PORTAL_MODULES.map(module => module.key);

    expectedClientSidebarKeys.forEach(key => {
      expect(moduleKeys).toContain(key);
      expect(routes[key]).toBeTruthy();
      expect(routes[key].title).toBeTruthy();
    });
  });

  it('exposes mensagens and suporte in the admin Relacionamento section', () => {
    const modules = getSidebarModules({ isAdmin: true });

    Object.entries(expectedAdminRelacionamento).forEach(([key, expected]) => {
      const module = modules.find(item => item.key === key);
      expect(module).toMatchObject(expected);
    });
  });

  it('exposes partes in the admin Cadastros section', () => {
    const modules = getSidebarModules({ isAdmin: true });
    const partes = modules.find(m => m.key === 'partes');
    expect(partes).toMatchObject({ menuLabel: 'Partes', adminSidebarSectionLabel: 'Cadastros' });
  });

  it('exposes operational legal modules for admin workflow', () => {
    const modules = getSidebarModules({ isAdmin: true });

    Object.entries(expectedAdminOperations).forEach(([key, expected]) => {
      const module = modules.find(item => item.key === key);
      expect(module).toMatchObject(expected);
    });
  });
});
