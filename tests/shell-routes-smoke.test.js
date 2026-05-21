import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getSidebarModules } from '../js/navigation.js';

const root = process.cwd();
const sidebarKeys = getSidebarModules({ isAdmin: false }).map(module => module.key);

function readWorkspaceFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('authenticated route shell smoke', () => {
  it('keeps sidebar fallback connected to the canonical seven modules', () => {
    const sidebarHtml = readWorkspaceFile('components', 'sidebar.html');

    sidebarKeys.forEach(key => {
      expect(sidebarHtml).toContain(`data-page="${key}"`);
      expect(sidebarHtml).toContain(`href="${key}.html"`);
    });

    expect((sidebarHtml.match(/data-page="/g) || []).length).toBe(7);
  });

  it('keeps every authenticated route mounted inside the shared shell', () => {
    sidebarKeys.forEach(key => {
      const pageHtml = readWorkspaceFile('pages', `${key}.html`);

      expect(pageHtml).toContain('data-component="sidebar"');
      expect(pageHtml).toContain('data-component="header"');
      expect(pageHtml).toContain('main class="page-content"');
      expect(pageHtml).toContain('../js/app.js?v=20260521p');
      expect(pageHtml.replace(/<script[\s\S]*?<\/script>/gi, '')).toMatch(/<main class="page-content"[\s\S]*?<\/main>/);
    });
  });
});
