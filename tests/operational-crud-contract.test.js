import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();
const requiredCrudModules = ['clientes', 'partes', 'documentos', 'dividas', 'planos', 'tarefas', 'agenda', 'mensagens', 'processos'];

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('operational CRUD contract', () => {
  it('defines every required CRUD module with real field contracts', () => {
    requiredCrudModules.forEach(key => {
      const config = ADVOGADO_MODULES[key];

      expect(config).toBeTruthy();
      expect(config.fields.length).toBeGreaterThanOrEqual(5);
      expect(config.fields.some(field => field.required)).toBe(true);
      expect(config.status.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('persists operational CRUD through Supabase tables with audit and logical delete', () => {
    const service = readFile('modules', 'advogado', 'RegistroAdvogadoService.js');
    const migration = readFile('supabase', 'migrations-safe', '20260521_safe_013_operational_crud.sql');
    const migrationClient = readFile('supabase', 'migrations-safe', '20260521_safe_017_cliente_modules_partes_vinculos.sql');

    expect(service).toContain("from(OPERATIONAL_TABLE)");
    expect(service).toContain("from(AUDIT_TABLE)");
    expect(service).toContain("from(PARTES_LINKS_TABLE)");
    expect(service).toContain('archived_at');
    expect(service).toContain('deleted_at');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS portal_operational_records');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS portal_operational_record_audit');
    expect(migration).toContain('ALTER TABLE portal_operational_records ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('is_any_admin()');
    expect(migrationClient).toContain('CREATE TABLE IF NOT EXISTS portal_custas');
    expect(migrationClient).toContain('CREATE TABLE IF NOT EXISTS portal_contratos');
    expect(migrationClient).toContain('CREATE TABLE IF NOT EXISTS portal_planos_pagamento');
    expect(migrationClient).toContain('CREATE TABLE IF NOT EXISTS portal_partes_vinculos');
  });

  it('keeps complete CRUD UX hooks available in the shared controller', () => {
    const controller = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');

    ['create', 'edit', 'delete', 'archive', 'timeline', 'detail'].forEach(action => {
      expect(controller).toContain(action);
    });
    expect(controller).toContain('data-advogado-filter="query"');
    expect(controller).toContain('data-advogado-filter="processoId"');
    expect(controller).toContain('data-advogado-filter="planoPagamentoId"');
    expect(controller).toContain('data-advogado-filter="clienteUserId"');
    expect(controller).toContain('data-advogado-filter="vinculoStatus"');
    expect(controller).toContain('data-advogado-page="next"');
    expect(controller).toContain('advogado-audit-box');
  });
});
