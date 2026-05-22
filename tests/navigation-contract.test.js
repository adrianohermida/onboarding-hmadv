import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules, PORTAL_MODULES } from '../js/navigation.js';

const expectedSidebarKeys = [
  'meu-caso',
  'custas',
  'meus-documentos',
  'contratos',
  'meu-plano',
  'plano-pagamento',
  'mensagens',
  'ajuda',
  'onboarding-v2',
  'financial-dashboard',
  'suporte',
  'onboarding',
];

const expectedBusinessLabels = {
  'onboarding-v2': { title: 'Jornada CNJ', menuLabel: 'Jornada', sidebarSectionLabel: 'Jornada e suporte' },
  'financial-dashboard': { title: 'Diagnóstico Financeiro', menuLabel: 'Diagnóstico', sidebarSectionLabel: 'Jornada e suporte' },
  suporte: { title: 'Suporte', menuLabel: 'Suporte', sidebarSectionLabel: 'Jornada e suporte' },
  onboarding: { title: 'Formulário', menuLabel: 'Formulário', sidebarSectionLabel: 'Jornada e suporte' },
};

const expectedAdminCaseLabels = {
  'onboarding-v2': { menuLabel: 'Jornada', adminSidebarSectionLabel: 'Gestão do caso' },
  'financial-dashboard': { menuLabel: 'Diagnóstico', adminSidebarSectionLabel: 'Gestão do caso' },
  suporte: { menuLabel: 'Suporte', adminSidebarSectionLabel: 'Gestão do caso' },
  onboarding: { menuLabel: 'Formulário', adminSidebarSectionLabel: 'Gestão do caso' },
};

const expectedAdminOperations = {
  partes: { title: 'Partes', menuLabel: 'Partes' },
  audiencias: { title: 'Audiencias', menuLabel: 'Audiencias' },
  publicacoes: { title: 'Publicacoes', menuLabel: 'Publicacoes' },
};

describe('navigation contract', () => {
  it('exposes the client portal modules in the expected order', () => {
    const modules = getSidebarModules({ isAdmin: false });

    expect(modules.map(module => module.key)).toEqual(expectedSidebarKeys);
    expect(new Set(modules.map(module => module.key)).size).toBe(expectedSidebarKeys.length);
    expect(modules.every(module => module.visible)).toBe(true);
  });

  it('keeps routes and sidebar modules sourced from the same module registry', () => {
    const routes = getRoutes();
    const moduleKeys = PORTAL_MODULES.map(module => module.key);

    expectedSidebarKeys.forEach(key => {
      expect(moduleKeys).toContain(key);
      expect(routes[key]).toBeTruthy();
      expect(routes[key].title).toBeTruthy();
    });
  });

  it('uses explicit business labels for the jornada, diagnostico and formulario flows', () => {
    const modules = getSidebarModules({ isAdmin: false });

    Object.entries(expectedBusinessLabels).forEach(([key, expected]) => {
      const module = modules.find(item => item.key === key);

      expect(module).toMatchObject(expected);
    });
  });

  it('also exposes the case-management flows in the admin shell', () => {
    const modules = getSidebarModules({ isAdmin: true });

    Object.entries(expectedAdminCaseLabels).forEach(([key, expected]) => {
      const module = modules.find(item => item.key === key);

      expect(module).toMatchObject(expected);
    });
  });

  it('exposes operational legal modules for admin workflow', () => {
    const modules = getSidebarModules({ isAdmin: true });

    Object.entries(expectedAdminOperations).forEach(([key, expected]) => {
      const module = modules.find(item => item.key === key);

      expect(module).toMatchObject(expected);
    });
  });
});
