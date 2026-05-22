import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getSidebarModules } from '../js/navigation.js';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('mobile UX final checklist contract', () => {
  it('keeps complete admin and client page flows mounted in shared shell with breadcrumb header', () => {
    const clientKeys = getSidebarModules({ isAdmin: false }).map((module) => module.key);
    const adminKeys = getSidebarModules({ isAdmin: true }).map((module) => module.key);
    const allKeys = [...new Set([...clientKeys, ...adminKeys])];

    const header = readFile('shell', 'header', 'header.html');
    expect(header).toContain('header-breadcrumb');
    expect(header).toContain('header-page-title');

    allKeys.forEach((key) => {
      const html = readFile('pages', `${key}.html`);
      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('main class="page-content"');
      expect(html).toContain('../js/app.js?v=20260522a');
    });
  });

  it('enforces mobile drawer and safe-area behavior in shell runtime and layout css', () => {
    const layout = readFile('styles', 'layout.css');
    const shell = readFile('modules', 'ui', 'Shell.js');

    expect(layout).toContain('sidebar becomes a fixed overlay drawer');
    expect(layout).toContain('safe-area-inset-bottom');
    expect(layout).toContain('@media (max-width: 1023px)');

    expect(shell).toContain('viewport-fit=cover');
    expect(shell).toContain('touchstart');
    expect(shell).toContain('touchend');
    expect(shell).toContain('Escape');
  });

  it('keeps responsive table fallback rules active for mobile flows', () => {
    const components = readFile('styles', 'components.css');
    const layout = readFile('styles', 'layout.css');

    expect(components).toContain('.table-wrap thead');
    expect(components).toContain('.table-wrap td::before');
    expect(components).toContain('content: attr(data-label)');
    expect(layout).toContain('.table-wrap, [style*="overflow-x:auto"]');
    expect(layout).toContain('overflow-x: auto');
  });
});
