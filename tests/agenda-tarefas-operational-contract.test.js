import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildOperationalControl,
  buildOperationalNotification,
  PERFIS_OPERACIONAIS,
  PRIORIDADES_OPERACIONAIS,
  resolveOperationalSla,
} from '../modules/advogado/ControladoriaOperacional.js';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('agenda e tarefas operational contract', () => {
  it('calculates SLA, priority queue and reminders for operational controladoria', () => {
    const now = new Date('2026-05-21T12:00:00-04:00');
    const records = [
      {
        id: 'late',
        titulo: 'Cobrar documento pendente',
        prazo: '2026-05-21T08:00:00-04:00',
        prioridade: 'critica',
        perfil_responsavel: 'colaborador',
        responsavel: 'Controladoria',
        sla_horas: 24,
        status: 'aberta',
      },
      {
        id: 'soon',
        titulo: 'Preparar audiência',
        data: '2026-05-21T15:00:00-04:00',
        prioridade: 'alta',
        perfil_responsavel: 'advogado',
        responsavel: 'Advogado',
        sla_horas: 12,
        status: 'agendado',
      },
    ];

    const sla = resolveOperationalSla(records[0], now);
    const control = buildOperationalControl(records, 'tarefas', now);
    const notification = buildOperationalNotification(records[0], sla);

    expect(PERFIS_OPERACIONAIS).toEqual(['advogado', 'colaborador', 'financeiro', 'administrador']);
    expect(PRIORIDADES_OPERACIONAIS).toContain('critica');
    expect(sla.state).toBe('estourado');
    expect(control.overdue).toBe(1);
    expect(control.warning).toBe(1);
    expect(control.priorityQueue[0].record.id).toBe('late');
    expect(notification.title).toBe('SLA vencido');
  });

  it('wires agenda and tarefas fields, calendar, follow-up and shell notifications', () => {
    const tarefas = ADVOGADO_MODULES.tarefas;
    const agenda = ADVOGADO_MODULES.agenda;
    const controller = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');
    const styles = readFile('styles', 'components.css');

    ['sla_horas', 'perfil_responsavel', 'lembrete_em', 'responsavel', 'prioridade'].forEach(field => {
      expect(tarefas.fields.some(item => item.key === field)).toBe(true);
    });
    ['sla_horas', 'perfil_responsavel', 'lembrete_em', 'responsavel', 'data'].forEach(field => {
      expect(agenda.fields.some(item => item.key === field)).toBe(true);
    });
    expect(controller).toContain('renderOperationalControladoria');
    expect(controller).toContain('data-ops-action="notify"');
    expect(controller).toContain('window.shellNotify');
    expect(styles).toContain('.ops-control');
    expect(styles).toContain('.ops-calendar-row');
    expect(styles).toContain('.ops-queue-item');
  });
});
