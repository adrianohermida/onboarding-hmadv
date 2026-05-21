import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const uiRoot = path.join(root, 'components', 'ui');

const requiredComponents = [
  'button',
  'input',
  'select',
  'textarea',
  'modal',
  'drawer',
  'sidebar',
  'card',
  'table',
  'tabs',
  'timeline',
  'steps',
  'upload',
  'badge',
  'toast',
  'calendar',
  'dropdown',
  'pagination',
  'search',
  'stat-card',
  'kanban-card',
  'form-section',
];

const requiredClasses = [
  '.ui-btn',
  '.ui-input',
  '.ui-select',
  '.ui-textarea',
  '.ui-modal',
  '.ui-drawer',
  '.ui-sidebar',
  '.ui-card',
  '.ui-table',
  '.ui-tabs',
  '.ui-timeline',
  '.ui-steps',
  '.ui-upload',
  '.ui-badge',
  '.ui-toast',
  '.ui-calendar',
  '.ui-dropdown',
  '.ui-pagination',
  '.ui-search',
  '.ui-stat-card',
  '.ui-kanban-card',
  '.ui-form-section',
];

const legalPatterns = [
  '.ui-process-table',
  '.ui-legal-timeline',
  '.ui-document-upload',
  '.ui-onboarding-steps',
  '.ui-finance-card',
  '.ui-client-panel',
  '.ui-lawyer-panel',
];

describe('ui kit contract', () => {
  it('provides every required component folder with a css entrypoint', () => {
    requiredComponents.forEach(component => {
      expect(fs.existsSync(path.join(uiRoot, component, 'index.css'))).toBe(true);
    });
  });

  it('exposes base components and legal patterns in the shared stylesheet', () => {
    const css = fs.readFileSync(path.join(uiRoot, 'ui-kit.css'), 'utf8');

    [...requiredClasses, ...legalPatterns].forEach(className => {
      expect(css).toContain(className);
    });

    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('@media (min-width: 640px)');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('is loaded by the existing portal stylesheet and shell bootstrap', () => {
    const componentsCss = fs.readFileSync(path.join(root, 'styles', 'components.css'), 'utf8');
    const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

    expect(componentsCss).toContain("@import '../components/ui/index.css'");
    expect(appJs).toContain("import { initUiKit }");
    expect(appJs).toContain('initUiKit(document)');
  });
});
