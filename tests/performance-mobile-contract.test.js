import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

describe('Sprint 1.16 performance e mobile', () => {
  it('mantem shell estavel com cache de componentes e validacao cliente/admin', () => {
    const app = read('js/app.js');

    expect(app).toContain('componentHtmlCache');
    expect(app).toContain('shellComponentLoaded');
    expect(app).toContain('shellComponentUrl');
    expect(app).toContain('navLinks.length >= 6');
  });

  it('atualiza listas operacionais sem remontar o modulo inteiro', () => {
    const page = read('modules/advogado/PortalAdvogadoPage.js');

    expect(page).toContain('function refreshList');
    expect(page).toContain('setTimeout(() => refreshList(host), 120)');
    expect(page).toContain('data-virtual-list="advogado-records"');
    expect(page).toContain('data-advogado-pagination');
  });

  it('usa cards mobile responsivos para tabelas compactas', () => {
    const css = read('styles/components.css');
    const dividas = read('pages/dividas.html');

    expect(css).toContain('content-visibility: auto');
    expect(css).toContain('.table-wrap td::before');
    expect(css).toContain('content: attr(data-label)');
    expect(dividas).toContain('data-label="Credor"');
    expect(dividas).toContain('data-label="Ações"');
  });
});
