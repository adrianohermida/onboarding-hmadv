import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules, PORTAL_MODULES } from '../js/navigation.js';

const expectedSidebarKeys = [
  'meu-caso',
  'meus-documentos',
  'minhas-dividas',
  'meu-plano',
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
});
