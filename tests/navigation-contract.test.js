import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules, PORTAL_MODULES } from '../js/navigation.js';

const expectedSidebarKeys = [
  'dashboard',
  'onboarding-v2',
  'financial-dashboard',
  'documentos',
  'dividas',
  'suporte',
  'onboarding',
];

describe('navigation contract', () => {
  it('exposes the seven authenticated modules in the expected order', () => {
    const modules = getSidebarModules({ isAdmin: false });

    expect(modules.map(module => module.key)).toEqual(expectedSidebarKeys);
    expect(new Set(modules.map(module => module.key)).size).toBe(7);
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
});
