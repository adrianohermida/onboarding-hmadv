import { AdminService } from '../../services/database.js';
import {
  ADVOGADO_MODULES,
  archiveAdvogadoRecord,
  deleteAdvogadoRecord,
  filterAdvogadoRecords,
  getAdvogadoModuleConfig,
  listAdvogadoRecords,
  listAdvogadoAudit,
  listAdvogadoTimeline,
  paginateAdvogadoRecords,
  saveAdvogadoRecord,
} from './RegistroAdvogadoService.js';
import {
  buildOperationalControl,
  buildOperationalNotification,
  resolveOperationalSla,
} from './ControladoriaOperacional.js';
import { financialPlanEngine } from '../financeiro/FinancialPlanEngine.js';
import { buildCommunicationSnapshot } from '../mensagens/CommunicationCenter.js';
import { buildCaseContextHref, formatCaseFlowDate, getCaseFlowSummary } from '../../js/case-flow.js';

const ADMIN_PAGE_KEYS = ['clientes', 'partes', 'documentos', 'planos', 'processos', 'tarefas', 'agenda', 'mensagens', 'financeiro'];
const CASE_MANAGEMENT_PAGES = ['onboarding-v2', 'onboarding', 'financial-dashboard', 'suporte'];

const state = {
  moduleKey: '',
  records: [],
  remoteClients: [],
  query: '',
  status: 'todos',
  archived: false,
  page: 1,
  pageSize: 8,
};

let queryRenderTimer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number === 0) return '-';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function normalizeStatusLabel(value = '') {
  return String(value || '-').replace(/_/g, ' ');
}

function getRecordTitle(record, config) {
  return record[config.primaryField] || record.nome || record.cliente || record.titulo || record.descricao || 'Registro';
}

function localRecordsWithRemoteClients(moduleKey) {
  const local = state.localRecords || [];
  if (moduleKey !== 'clientes') return local;

  const remote = state.remoteClients.map(client => ({
    id: `supabase:${client.user_id || client.email || client.full_name}`,
    source: 'supabase',
    nome: client.full_name || client.email || 'Cliente',
    email: client.email || '',
    cpf: client.cpf || '',
    fase: client.fase || 'cadastro',
    status: client.onboarding_done ? 'ativo' : 'em_onboarding',
    responsavel: client.workspace_slug || '',
    prazo: '',
    createdAt: client.created_at,
    updatedAt: client.created_at,
    archived: false,
  }));

  return [...local, ...remote];
}

async function loadModuleRecords(moduleKey) {
  state.localRecords = await listAdvogadoRecords(moduleKey);
  return localRecordsWithRemoteClients(moduleKey);
}

function renderField(field, record = {}) {
  const value = record[field.key] ?? '';
  const required = field.required ? 'required' : '';

  if (field.type === 'textarea') {
    return `
      <label class="ui-field advogado-form-field advogado-form-field-full">
        <span class="ui-label">${escapeHtml(field.label)}</span>
        <textarea class="ui-textarea" name="${field.key}" rows="3" ${required}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (field.type === 'select') {
    return `
      <label class="ui-field advogado-form-field">
        <span class="ui-label">${escapeHtml(field.label)}</span>
        <select class="ui-select" name="${field.key}" ${required}>
          <option value="">Selecionar</option>
          ${(field.options || []).map(option => `
            <option value="${escapeHtml(option)}" ${String(value) === option ? 'selected' : ''}>${escapeHtml(option)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  return `
    <label class="ui-field advogado-form-field">
      <span class="ui-label">${escapeHtml(field.label)}</span>
      <input class="ui-input" name="${field.key}" type="${field.type || 'text'}" value="${escapeHtml(value)}" ${required}>
    </label>
  `;
}

function openRecordForm(record = null) {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  if (!config) return;
  const isEdit = Boolean(record);
  const canEdit = !record || record.source !== 'supabase';
  const title = `${isEdit ? 'Editar' : 'Criar'} ${config.singular}`;

  const body = `
    <form class="advogado-form" id="advogado-record-form" data-record-id="${escapeHtml(record?.id || '')}">
      <div class="advogado-form-grid">
        ${config.fields.map(field => renderField(field, record || {})).join('')}
        <label class="ui-field advogado-form-field">
          <span class="ui-label">Status</span>
          <select class="ui-select" name="status" ${canEdit ? '' : 'disabled'}>
            ${config.status.map(status => `
              <option value="${escapeHtml(status)}" ${(record?.status || config.status[0]) === status ? 'selected' : ''}>${escapeHtml(normalizeStatusLabel(status))}</option>
            `).join('')}
          </select>
        </label>
      </div>
      ${canEdit ? '' : '<p class="advogado-form-hint">Registro vindo do Supabase. Crie um acompanhamento local para editar informações operacionais.</p>'}
      <div class="advogado-form-actions">
        <button type="button" class="btn btn-ghost" data-advogado-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary" ${canEdit ? '' : 'disabled'}>Salvar</button>
      </div>
    </form>
  `;

  window.shellModal?.open?.({ title, body });
  const form = document.getElementById('advogado-record-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    await saveAdvogadoRecord(state.moduleKey, payload, isEdit ? record.id : null);
    window.shellModal?.close?.();
    await refreshRecords();
  });
  form?.querySelector('[data-advogado-close-modal]')?.addEventListener('click', () => window.shellModal?.close?.());
}

async function openTimeline(record) {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  const events = await listAdvogadoTimeline(state.moduleKey, record.id);
  const body = `
    <div class="advogado-timeline-panel">
      <div class="advogado-record-summary">
        <strong>${escapeHtml(getRecordTitle(record, config))}</strong>
        <span>${escapeHtml(normalizeStatusLabel(record.status))}</span>
      </div>
      <div class="ui-timeline">
        ${events.length ? events.map(event => `
          <div class="ui-timeline-item">
            <span class="ui-timeline-dot"></span>
            <div>
              <strong>${escapeHtml(normalizeStatusLabel(event.type))}</strong>
              <p>${escapeHtml(event.detail)}</p>
              <time>${formatDate(event.createdAt)}</time>
            </div>
          </div>
        `).join('') : '<div class="advogado-empty-mini">Nenhum evento registrado para este item.</div>'}
      </div>
    </div>
  `;
  window.shellDrawer?.open?.({ eyebrow: 'Timeline', title: config.title, body });
}

async function openDetail(record) {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  const audit = await listAdvogadoAudit(state.moduleKey, record.id);
  const fields = config.fields.map(field => {
    const value = record[field.key];
    return `
      <div class="advogado-detail-row">
        <span>${escapeHtml(field.label)}</span>
        <strong>${escapeHtml(value || '-')}</strong>
      </div>
    `;
  }).join('');

  const body = `
    <div class="advogado-detail-panel">
      <div class="advogado-record-summary">
        <strong>${escapeHtml(getRecordTitle(record, config))}</strong>
        <span>${escapeHtml(normalizeStatusLabel(record.status))}</span>
      </div>
      <div class="advogado-detail-grid">${fields}</div>
      <div class="advogado-audit-box">
        <h3>Auditoria</h3>
        ${audit.length ? audit.slice(0, 8).map(event => `
          <div class="advogado-audit-item">
            <strong>${escapeHtml(normalizeStatusLabel(event.type))}</strong>
            <span>${formatDate(event.createdAt)}</span>
          </div>
        `).join('') : '<div class="advogado-empty-mini">Nenhum evento de auditoria registrado.</div>'}
      </div>
    </div>
  `;
  window.shellDrawer?.open?.({ eyebrow: 'Detalhe', title: config.title, body });
}

function getSecondaryInfo(record, config) {
  const keys = config.fields
    .map(field => field.key)
    .filter(key => key !== config.primaryField && record[key])
    .slice(0, 3);

  return keys.map(key => {
    const field = config.fields.find(item => item.key === key);
    const raw = record[key];
    const value = key === 'valor' ? formatMoney(raw) : key.includes('data') || key.includes('prazo') || key.includes('vencimento') ? formatDate(raw) : raw;
    return `<span>${escapeHtml(field?.label || key)}: ${escapeHtml(value)}</span>`;
  }).join('');
}

function renderFinancialSimulator() {
  if (!['financeiro', 'planos'].includes(state.moduleKey)) return '';

  return `
    <section class="financial-simulator sec" data-financial-simulator>
      <div class="financial-simulator-head">
        <div>
          <span class="ui-badge">Análise financeira</span>
          <h2>Plano de pagamento consolidado</h2>
          <p>Simulação com Anexo II CNJ, mínimo existencial, lógica Jusfy e planilha Guilherme.</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-financial-export>Exportar CSV</button>
      </div>
      <div class="financial-simulator-grid">
        <label class="ui-field">
          <span class="ui-label">Renda mensal</span>
          <input class="ui-input" type="number" min="0" step="0.01" value="3500" data-financial-input="renda_mensal">
        </label>
        <label class="ui-field">
          <span class="ui-label">Renda familiar</span>
          <input class="ui-input" type="number" min="0" step="0.01" value="0" data-financial-input="renda_familiar">
        </label>
        <label class="ui-field">
          <span class="ui-label">Despesas essenciais</span>
          <input class="ui-input" type="number" min="0" step="0.01" value="1800" data-financial-input="despesas_essenciais">
        </label>
        <label class="ui-field">
          <span class="ui-label">Total de dívidas</span>
          <input class="ui-input" type="number" min="0" step="0.01" value="48000" data-financial-input="total_dividas">
        </label>
      </div>
      <div class="financial-simulator-result" data-financial-result></div>
    </section>
  `;
}

function renderCaseManagementPanel() {
  const summaries = state.remoteClients.map(client => ({
    client,
    summary: getCaseFlowSummary(client),
  }));

  const counts = summaries.reduce((acc, item) => {
    acc[item.summary.key] = (acc[item.summary.key] || 0) + 1;
    return acc;
  }, { not_started: 0, in_progress: 0, submitted: 0, approved: 0, correction: 0 });

  const rows = summaries.length
    ? summaries.map(({ client, summary }) => `
        <tr>
          <td data-label="Cliente">
            <strong>${escapeHtml(client.full_name || client.email || 'Cliente')}</strong>
            <div class="advogado-flow-sub">${escapeHtml(client.fase || 'cadastro')} · ${escapeHtml(client.cpf || client.email || 'sem CPF')}</div>
          </td>
          <td data-label="Status CNJ">
            <span class="advogado-flow-pill is-${escapeHtml(summary.tone)}">${escapeHtml(summary.label)}</span>
            <div class="advogado-flow-sub">${escapeHtml(summary.detail)}</div>
          </td>
          <td data-label="Progresso">
            <strong>${summary.step}/7</strong>
            <div class="advogado-flow-sub">${summary.progressPct}% concluído</div>
          </td>
          <td data-label="Informações">
            <strong>${client.n_credores || 0}</strong>
            <div class="advogado-flow-sub">Docs ${client.docs_aprovados || 0} aprov. · ${client.docs_pendentes || 0} pend.</div>
          </td>
          <td data-label="Atualização">
            <strong>${escapeHtml(formatCaseFlowDate(summary.updatedAt))}</strong>
            <div class="advogado-flow-sub">Último salvamento no caso</div>
          </td>
          <td data-label="Ações">
            <div class="advogado-flow-actions">
              <a class="btn btn-ghost btn-sm" href="${buildCaseContextHref('onboarding-v2', { clientId: client.user_id })}" data-page="onboarding-v2">Jornada</a>
              <a class="btn btn-ghost btn-sm" href="${buildCaseContextHref('onboarding', { source: 'journey', clientId: client.user_id })}" data-page="onboarding">Formulário</a>
              <a class="btn btn-ghost btn-sm" href="${buildCaseContextHref('financial-dashboard', { clientId: client.user_id })}" data-page="financial-dashboard">Diagnóstico</a>
              <button type="button" class="btn btn-outline btn-sm" data-case-reset="${escapeHtml(client.user_id)}">Reiniciar</button>
            </div>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="6">Nenhum cliente disponível para acompanhamento.</td></tr>';

  return `
    <section class="sec advogado-case-flow-panel">
      <div class="sec-header">
        <div class="sec-num">CNJ</div>
        <h2 class="sec-title">Gestão do caso</h2>
        <span class="sec-tag">Jornada, formulário e diagnóstico</span>
      </div>

      <div class="advogado-kpis advogado-flow-kpis">
        <div class="ui-stat-card"><span>Não iniciados</span><strong>${counts.not_started}</strong></div>
        <div class="ui-stat-card"><span>Em progresso</span><strong>${counts.in_progress}</strong></div>
        <div class="ui-stat-card"><span>Enviados</span><strong>${counts.submitted}</strong></div>
        <div class="ui-stat-card"><span>Aprovados</span><strong>${counts.approved}</strong></div>
      </div>

      <div class="advogado-workspace-grid advogado-case-module-grid">
        ${CASE_MANAGEMENT_PAGES.map(key => {
          const labels = {
            'onboarding-v2': ['Jornada', 'Acompanhar a trilha CNJ e retomadas.'],
            onboarding: ['Formulário', 'Abrir o formulário web preenchido pelo cliente.'],
            'financial-dashboard': ['Diagnóstico', 'Validar capacidade de pagamento e Anexo II.'],
            suporte: ['Suporte', 'Consultar chamados e devolutivas do caso.'],
          };
          const [title, copy] = labels[key];
          return `
            <a class="advogado-module-card" href="${key}.html" data-page="${key}">
              <span>${escapeHtml(title)}</span>
              <strong>Fluxo</strong>
              <small>${escapeHtml(copy)}</small>
            </a>
          `;
        }).join('')}
      </div>

      <div class="table-wrap advogado-case-flow-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Status CNJ</th>
              <th>Progresso</th>
              <th>Informações</th>
              <th>Atualização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function renderOperationalControladoria() {
  if (!['tarefas', 'agenda'].includes(state.moduleKey)) return '';
  const control = buildOperationalControl(state.records, state.moduleKey);
  const title = state.moduleKey === 'agenda' ? 'Calendário operacional' : 'Controladoria de tarefas';
  const subtitle = state.moduleKey === 'agenda'
    ? 'Compromissos, retornos, responsáveis, lembretes e prazos críticos.'
    : 'SLA, prioridade, responsáveis e follow-up do caso em uma fila acionável.';

  const queue = control.priorityQueue.length ? control.priorityQueue.map(({ record, sla }) => `
    <article class="ops-queue-item is-${escapeHtml(sla.state)}">
      <div>
        <span>${escapeHtml(record.prioridade || record.tipo || 'operacional')}</span>
        <strong>${escapeHtml(getRecordTitle(record, getAdvogadoModuleConfig(state.moduleKey)))}</strong>
        <small>${escapeHtml(record.responsavel || 'Sem responsável')} · ${escapeHtml(record.perfil_responsavel || 'colaborador')}</small>
      </div>
      <div>
        <strong>${formatDateTime(sla.dueAt)}</strong>
        <small>${sla.remainingHours === null ? 'sem SLA' : `${sla.remainingHours}h`}</small>
      </div>
    </article>
  `).join('') : '<div class="advogado-empty-mini">Nenhuma pendência ativa na fila.</div>';

  const calendar = control.timeline.slice(0, 8).map(({ record, sla }) => `
    <div class="ops-calendar-row">
      <time>${formatDateTime(sla.dueAt)}</time>
      <strong>${escapeHtml(getRecordTitle(record, getAdvogadoModuleConfig(state.moduleKey)))}</strong>
      <span>${escapeHtml(record.status || '-')}</span>
    </div>
  `).join('') || '<div class="advogado-empty-mini">Calendário sem eventos cadastrados.</div>';

  return `
    <section class="ops-control sec" data-ops-control>
      <div class="ops-control-head">
        <div>
          <span class="ui-badge">Controladoria operacional</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-ops-action="notify">Gerar lembretes</button>
      </div>
      <div class="ops-kpis">
        <article><span>Total ativo</span><strong>${control.total}</strong></article>
        <article><span>SLA vencido</span><strong>${control.overdue}</strong></article>
        <article><span>Em alerta</span><strong>${control.warning}</strong></article>
        <article><span>No prazo</span><strong>${control.onTime}</strong></article>
      </div>
      <div class="ops-layout">
        <div>
          <h3>Fila de follow-up</h3>
          <div class="ops-queue">${queue}</div>
        </div>
        <div>
          <h3>Calendário compacto</h3>
          <div class="ops-calendar">${calendar}</div>
        </div>
      </div>
    </section>
  `;
}

function renderCommunicationCenter() {
  if (state.moduleKey !== 'mensagens') return '';
  const snapshot = buildCommunicationSnapshot(state.records);
  const threads = snapshot.threads.slice(0, 6).map(thread => `
    <article class="comm-thread-card">
      <div>
        <span>${escapeHtml(thread.channel)} · ${escapeHtml(thread.status)}</span>
        <strong>${escapeHtml(thread.subject)}</strong>
        <small>${escapeHtml(thread.client)} · ${thread.comments.length} comentário(s)</small>
      </div>
      <div>
        <strong>${thread.attachments.length}</strong>
        <small>anexo(s)</small>
      </div>
    </article>
  `).join('') || '<div class="advogado-empty-mini">Nenhuma thread operacional aberta.</div>';

  const timeline = snapshot.timeline.slice(0, 8).map(event => `
    <div class="comm-timeline-item">
      <span>${escapeHtml(event.source)}</span>
      <strong>${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.detail)}</p>
      <small>${formatDateTime(event.createdAt)}</small>
    </div>
  `).join('') || '<div class="advogado-empty-mini">Histórico operacional vazio.</div>';

  return `
    <section class="comm-center sec" data-communication-center>
      <div class="comm-center-head">
        <div>
          <span class="ui-badge">Comunicação jurídica</span>
          <h2>Mensagens, comentários e timeline</h2>
          <p>Central operacional para threads, anexos, eventos e histórico do cliente.</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-comm-action="notify">Notificar responsável</button>
      </div>
      <div class="comm-kpis">
        <article><span>Threads abertas</span><strong>${snapshot.openThreads}</strong></article>
        <article><span>Comentários</span><strong>${snapshot.comments}</strong></article>
        <article><span>Anexos</span><strong>${snapshot.attachments}</strong></article>
        <article><span>Eventos cliente</span><strong>${snapshot.visibleClientEvents}</strong></article>
      </div>
      <div class="comm-layout">
        <div>
          <h3>Threads recentes</h3>
          <div class="comm-thread-list">${threads}</div>
        </div>
        <div>
          <h3>Timeline jurídica</h3>
          <div class="comm-timeline">${timeline}</div>
        </div>
      </div>
    </section>
  `;
}

function readFinancialSimulatorPayload(host) {
  const getValue = key => Number(host.querySelector(`[data-financial-input="${key}"]`)?.value || 0);
  return {
    caso: {
      renda_mensal: getValue('renda_mensal'),
      renda_familiar: getValue('renda_familiar'),
      despesas: {
        moradia: getValue('despesas_essenciais'),
      },
    },
    debts: [
      {
        credor: 'Consolidado',
        tipo: 'plano',
        valor: getValue('total_dividas'),
        parcela_mensal: getValue('total_dividas') / 36,
      },
    ],
  };
}

function renderFinancialSimulatorResult(host) {
  const result = host.querySelector('[data-financial-result]');
  if (!result) return null;
  const payload = readFinancialSimulatorPayload(host);
  const plan = financialPlanEngine.buildConsolidatedPlan(payload.caso, payload.debts);
  const diag = plan.diagnostico;
  const proposal = plan.proposal;
  result.innerHTML = `
    <article><span>Renda total</span><strong>${formatMoney(diag.rendaTotal)}</strong></article>
    <article><span>Mínimo existencial</span><strong>${formatMoney(diag.minExistencial)}</strong></article>
    <article><span>Comprometimento</span><strong>${Number(diag.comprometimentoPct || 0).toFixed(1)}%</strong></article>
    <article><span>Parcela sugerida</span><strong>${formatMoney(proposal.parcelaSugerida)}</strong></article>
    <article class="financial-result-wide"><span>Proposta</span><strong>${escapeHtml(proposal.observacao)}</strong></article>
  `;
  host.dataset.financialCsv = financialPlanEngine.exportCsv(plan);
  return plan;
}

function renderRows(rows, config) {
  if (!rows.length) {
    return `
      <div class="advogado-empty-state">
        <h2>Nenhum registro encontrado</h2>
        <p>Use o botão principal para criar um registro operacional deste módulo.</p>
      </div>
    `;
  }

  return `
    <div class="advogado-record-list" data-virtual-list="advogado-records">
      ${rows.map(record => {
        const readOnly = record.source === 'supabase';
        return `
          <article class="advogado-record-card" data-record-id="${escapeHtml(record.id)}">
            <div class="advogado-record-main">
              <span class="ui-badge advogado-status">${escapeHtml(normalizeStatusLabel(record.status))}</span>
              <h2>${escapeHtml(getRecordTitle(record, config))}</h2>
              <div class="advogado-record-meta">${getSecondaryInfo(record, config)}</div>
            </div>
            <div class="advogado-record-side">
              <span>Atualizado em ${formatDate(record.updatedAt || record.createdAt)}</span>
              <div class="advogado-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-action="timeline">Timeline</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="detail">Detalhe</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="edit" ${readOnly ? 'disabled' : ''}>Editar</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="archive" ${readOnly || record.archived ? 'disabled' : ''}>Arquivar</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="delete" ${readOnly ? 'disabled' : ''}>Excluir</button>
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function getPaginatedRecords() {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  if (!config) return null;

  const filtered = filterAdvogadoRecords(state.records, {
    query: state.query,
    status: state.status,
    archived: state.archived,
  });
  const paginated = paginateAdvogadoRecords(filtered, state.page, state.pageSize);
  state.page = paginated.page;
  return { config, paginated };
}

function renderPagination(paginated) {
  return `
    <div class="advogado-pagination" data-advogado-pagination>
      <span>${paginated.total} registro(s)</span>
      <div>
        <button type="button" class="btn btn-ghost btn-sm" data-advogado-page="prev" ${paginated.page <= 1 ? 'disabled' : ''}>Anterior</button>
        <span>Página ${paginated.page} de ${paginated.pages}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-advogado-page="next" ${paginated.page >= paginated.pages ? 'disabled' : ''}>Próxima</button>
      </div>
    </div>
  `;
}

function refreshList(host) {
  const view = getPaginatedRecords();
  if (!view) return;

  const recordsHost = host.querySelector('#advogado-records-host');
  const pagination = host.querySelector('[data-advogado-pagination]');
  const totalFiltered = host.querySelector('[data-advogado-kpi="filtered"]');

  if (recordsHost) {
    recordsHost.innerHTML = renderRows(view.paginated.rows, view.config);
    window.initUiKit?.(recordsHost);
  }
  if (pagination) pagination.outerHTML = renderPagination(view.paginated);
  if (totalFiltered) totalFiltered.textContent = view.paginated.total;
}

function renderModulePage() {
  const view = getPaginatedRecords();
  if (!view) return '';
  const { config, paginated } = view;

  const activeCount = state.records.filter(record => !record.archived).length;
  const archivedCount = state.records.filter(record => record.archived).length;
  const pendingCount = state.records.filter(record => !record.archived && !['aprovado', 'concluida', 'realizado', 'recebido', 'ativo'].includes(record.status)).length;

  return `
    <section class="advogado-page" data-advogado-module="${escapeHtml(state.moduleKey)}">
      <div class="page-header page-header-row advogado-header">
        <div>
          <h1>${escapeHtml(config.title)}</h1>
          <p>${escapeHtml(config.description)}</p>
        </div>
        <button type="button" class="btn btn-primary" data-advogado-action="create">+ Criar ${escapeHtml(config.singular)}</button>
      </div>

      <div class="advogado-kpis">
        <div class="ui-stat-card"><span>Ativos</span><strong>${activeCount}</strong></div>
        <div class="ui-stat-card"><span>Em andamento</span><strong>${pendingCount}</strong></div>
        <div class="ui-stat-card"><span>Arquivados</span><strong>${archivedCount}</strong></div>
        <div class="ui-stat-card"><span>Total filtrado</span><strong data-advogado-kpi="filtered">${paginated.total}</strong></div>
      </div>

      ${renderOperationalControladoria()}

      ${renderFinancialSimulator()}

      ${renderCommunicationCenter()}

      <div class="advogado-toolbar sec">
        <label class="ui-field advogado-search">
          <span class="ui-label">Busca</span>
          <input class="ui-input" type="search" value="${escapeHtml(state.query)}" data-advogado-filter="query" placeholder="Buscar por cliente, prazo, status ou responsável">
        </label>
        <label class="ui-field">
          <span class="ui-label">Status</span>
          <select class="ui-select" data-advogado-filter="status">
            <option value="todos">Todos</option>
            ${config.status.map(status => `<option value="${escapeHtml(status)}" ${state.status === status ? 'selected' : ''}>${escapeHtml(normalizeStatusLabel(status))}</option>`).join('')}
          </select>
        </label>
        <label class="ui-field">
          <span class="ui-label">Visão</span>
          <select class="ui-select" data-advogado-filter="archived">
            <option value="ativos" ${state.archived ? '' : 'selected'}>Ativos</option>
            <option value="arquivados" ${state.archived ? 'selected' : ''}>Arquivados</option>
          </select>
        </label>
      </div>

      <div id="advogado-records-host">
        ${renderRows(paginated.rows, config)}
      </div>

      ${renderPagination(paginated)}
    </section>
  `;
}

async function renderPainelPage(host) {
  const recordMap = {};
  for (const key of ADMIN_PAGE_KEYS) {
    state.localRecords = await listAdvogadoRecords(key);
    recordMap[key] = key === 'clientes' ? localRecordsWithRemoteClients(key) : state.localRecords;
  }

  const totals = ADMIN_PAGE_KEYS.reduce((acc, key) => {
    const records = recordMap[key] || [];
    acc.total += records.filter(record => !record.archived).length;
    acc.archived += records.filter(record => record.archived).length;
    return acc;
  }, { total: 0, archived: 0 });

  const moduleCards = ADMIN_PAGE_KEYS.map(key => {
    const config = ADVOGADO_MODULES[key];
    const records = recordMap[key] || [];
    const active = records.filter(record => !record.archived).length;
    return `
      <a class="advogado-module-card" href="${key}.html" data-page="${key}">
        <span>${escapeHtml(config.title)}</span>
        <strong>${active}</strong>
        <small>${escapeHtml(config.singular)}(s) ativos</small>
      </a>
    `;
  }).join('');

  host.innerHTML = `
    <section class="advogado-page advogado-painel">
      <div class="page-header page-header-row advogado-header">
        <div>
          <h1>Painel do Advogado</h1>
          <p>Workspace jurídico operacional para clientes, tarefas, prazos, documentos e financeiro.</p>
        </div>
        <a class="btn btn-primary" href="clientes.html" data-page="clientes">Abrir clientes</a>
      </div>

      <div class="advogado-kpis">
        <div class="ui-stat-card"><span>Clientes Supabase</span><strong>${state.remoteClients.length}</strong></div>
        <div class="ui-stat-card"><span>Registros ativos</span><strong>${totals.total}</strong></div>
        <div class="ui-stat-card"><span>Arquivados</span><strong>${totals.archived}</strong></div>
        <div class="ui-stat-card"><span>Módulos</span><strong>${ADMIN_PAGE_KEYS.length}</strong></div>
      </div>

      <div class="advogado-workspace-grid">
        ${moduleCards}
      </div>

      ${renderCaseManagementPanel()}
    </section>
  `;
}

function bindPainelEvents(host) {
  host.querySelectorAll('[data-case-reset]').forEach(button => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.caseReset;
      if (!userId) return;
      if (!window.confirm('Reiniciar jornada e formulário deste cliente?')) return;

      button.disabled = true;
      try {
        await AdminService.resetClientJourney(userId);
        await loadRemoteClients();
        await renderPainelPage(host);
        bindPainelEvents(host);
        window.shellNotify?.({
          title: 'Fluxo reiniciado',
          text: 'A jornada e o formulário do cliente foram reabertos para novo preenchimento.',
          tone: 'warn',
        });
      } catch (error) {
        button.disabled = false;
        window.shellNotify?.({
          title: 'Não foi possível reiniciar',
          text: error?.message || 'Tente novamente em instantes.',
          tone: 'warn',
        });
      }
    });
  });
}

function bindModuleEvents(host) {
  const simulator = host.querySelector('[data-financial-simulator]');
  if (simulator) renderFinancialSimulatorResult(simulator);

  host.addEventListener('input', event => {
    if (event.target?.dataset?.financialInput) {
      renderFinancialSimulatorResult(event.target.closest('[data-financial-simulator]'));
      return;
    }

    const filter = event.target?.dataset?.advogadoFilter;
    if (filter !== 'query') return;
    state.query = event.target.value;
    state.page = 1;
    clearTimeout(queryRenderTimer);
    queryRenderTimer = setTimeout(() => refreshList(host), 120);
  });

  host.addEventListener('change', event => {
    const filter = event.target?.dataset?.advogadoFilter;
    if (!filter) return;
    if (filter === 'status') state.status = event.target.value;
    if (filter === 'archived') state.archived = event.target.value === 'arquivados';
    state.page = 1;
    refreshList(host);
  });

  host.addEventListener('click', event => {
    const createButton = event.target.closest('[data-advogado-action="create"]');
    if (createButton) {
      openRecordForm();
      return;
    }

    const exportButton = event.target.closest('[data-financial-export]');
    if (exportButton) {
      const simulator = event.target.closest('[data-financial-simulator]');
      const csv = simulator?.dataset?.financialCsv || '';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plano-financeiro-hmadv.csv';
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const opsButton = event.target.closest('[data-ops-action="notify"]');
    if (opsButton) {
      const control = buildOperationalControl(state.records, state.moduleKey);
      const item = control.priorityQueue[0];
      const notification = item
        ? buildOperationalNotification(item.record, resolveOperationalSla(item.record))
        : { title: 'Controladoria operacional', text: 'Nenhum SLA crítico encontrado.', tone: 'brand' };
      window.shellNotify?.(notification);
      return;
    }

    const commButton = event.target.closest('[data-comm-action="notify"]');
    if (commButton) {
      const snapshot = buildCommunicationSnapshot(state.records);
      const thread = snapshot.threads[0];
      window.shellNotify?.({
        title: thread ? 'Thread operacional atualizada' : 'Comunicação jurídica',
        text: thread ? `${thread.client}: ${thread.subject}` : 'Nenhuma thread pendente encontrada.',
        tone: thread?.status === 'pendente' ? 'warn' : 'brand',
      });
      return;
    }

    const pageButton = event.target.closest('[data-advogado-page]');
    if (pageButton) {
      state.page += pageButton.dataset.advogadoPage === 'next' ? 1 : -1;
      refreshList(host);
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    const card = event.target.closest('[data-record-id]');
    if (!actionButton || !card) return;

    const record = state.records.find(item => item.id === card.dataset.recordId);
    if (!record) return;

    if (actionButton.dataset.action === 'timeline') openTimeline(record);
    if (actionButton.dataset.action === 'detail') openDetail(record);
    if (actionButton.dataset.action === 'edit') openRecordForm(record);
    if (actionButton.dataset.action === 'archive') {
      archiveAdvogadoRecord(state.moduleKey, record.id).then(refreshRecords);
    }
    if (actionButton.dataset.action === 'delete') {
      deleteAdvogadoRecord(state.moduleKey, record.id).then(refreshRecords);
    }
  });
}

function renderInto(host) {
  host.innerHTML = renderModulePage();
  window.initUiKit?.(host);
  const simulator = host.querySelector('[data-financial-simulator]');
  if (simulator) renderFinancialSimulatorResult(simulator);
}

async function refreshRecords() {
  state.records = await loadModuleRecords(state.moduleKey);
  const host = document.querySelector('[data-advogado-module-host]');
  if (host) renderInto(host);
}

async function loadRemoteClients() {
  try {
    state.remoteClients = await AdminService.getClients();
  } catch (error) {
    state.remoteClients = [];
    window.shellNotify?.({
      title: 'Clientes indisponíveis',
      text: error?.message || 'Não foi possível consultar o Supabase agora.',
      tone: 'warn',
    });
  }
}

export async function bootAdvogadoPage(moduleKey) {
  const host = document.querySelector('[data-advogado-module-host]');
  if (!host) return;

  await loadRemoteClients();

  if (moduleKey === 'painel') {
    await renderPainelPage(host);
    window.initUiKit?.(host);
    bindPainelEvents(host);
    return;
  }

  state.moduleKey = moduleKey;
  state.query = '';
  state.status = 'todos';
  state.archived = false;
  state.page = 1;
  state.records = await loadModuleRecords(moduleKey);

  renderInto(host);
  bindModuleEvents(host);
}
