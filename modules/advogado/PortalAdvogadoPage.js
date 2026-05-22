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

const ADMIN_PAGE_KEYS = ['clientes', 'partes', 'documentos', 'planos', 'processos', 'movimentacoes', 'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual', 'tpu', 'orgaos-judiciarios', 'serventias', 'relacoes-processuais', 'tarefas', 'agenda', 'mensagens', 'financeiro'];
const CASE_MANAGEMENT_PAGES = ['onboarding-v2', 'onboarding', 'financial-dashboard', 'suporte'];

const state = {
  moduleKey: '',
  records: [],
  remoteClients: [],
  internalUsers: [],
  query: '',
  status: 'todos',
  archived: false,
  processoId: '',
  planoPagamentoId: '',
  clienteUserId: '',
  vinculoStatus: 'todos',
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

function getInternalUserOptions() {
  return state.internalUsers.map((item) => ({
    value: item.id,
    label: item.name,
  }));
}

function getClientOptions() {
  return state.remoteClients.map((item) => ({
    value: item.user_id || item.email || item.full_name,
    label: item.full_name || item.email || 'Cliente',
  }));
}

function isResponsibleField(fieldKey) {
  return ['responsavel_id', 'advogado_responsavel_id', 'created_by_id', 'updated_by_id'].includes(fieldKey);
}

function isClientField(fieldKey) {
  return ['cliente_id', 'cliente_user_id', 'user_id'].includes(fieldKey);
}

function isAdvancedField(moduleKey, fieldKey) {
  const advancedByModule = {
    clientes: ['full_name', 'whatsapp', 'telefone', 'workspace_id', 'onboarding_done', 'cnj_step_atual', 'responsavel_id', 'cidade', 'estado', 'metadata', 'observacao'],
    processos: ['assunto_ids', 'orgao_julgador_tpu_id', 'fs_sync_hash', 'datajud_payload_hash', 'parser_tribunal_schema', 'parser_grau', 'parser_sistema', 'status_evento_origem'],
    partes: ['tenant_id', 'advogados', 'fonte', 'contact_id_freshsales', 'contato_freshsales_id', 'principal_no_account', 'observacao'],
  };
  return (advancedByModule[moduleKey] || []).includes(fieldKey);
}

function getModuleHref(moduleKey) {
  if (!moduleKey) return '#';
  return `${moduleKey}.html`;
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

function renderField(field, record = {}, moduleKey = '') {
  const value = record[field.key] ?? '';
  const required = field.required ? 'required' : '';

  if (isResponsibleField(field.key)) {
    const options = getInternalUserOptions();
    return `
      <label class="ui-field advogado-form-field ${isAdvancedField(moduleKey, field.key) ? 'advogado-advanced-field' : ''}">
        <span class="ui-label">${escapeHtml(field.label)}</span>
        <select class="ui-select" name="${field.key}" ${required}>
          <option value="">Selecionar responsável interno</option>
          ${options.map(option => `
            <option value="${escapeHtml(option.value)}" ${String(value) === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  if (isClientField(field.key)) {
    const options = getClientOptions();
    return `
      <label class="ui-field advogado-form-field ${isAdvancedField(moduleKey, field.key) ? 'advogado-advanced-field' : ''}">
        <span class="ui-label">${escapeHtml(field.label)}</span>
        <select class="ui-select" name="${field.key}" ${required}>
          <option value="">Associar cliente existente</option>
          ${options.map(option => `
            <option value="${escapeHtml(option.value)}" ${String(value) === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <label class="ui-field advogado-form-field advogado-form-field-full ${isAdvancedField(moduleKey, field.key) ? 'advogado-advanced-field' : ''}">
        <span class="ui-label">${escapeHtml(field.label)}</span>
        <textarea class="ui-textarea" name="${field.key}" rows="3" ${required}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (field.type === 'select') {
    return `
      <label class="ui-field advogado-form-field ${isAdvancedField(moduleKey, field.key) ? 'advogado-advanced-field' : ''}">
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
    <label class="ui-field advogado-form-field ${isAdvancedField(moduleKey, field.key) ? 'advogado-advanced-field' : ''}">
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
  const supportsInlineQuickClient = ['processos', 'partes'].includes(state.moduleKey);
  const title = `${isEdit ? 'Editar' : 'Criar'} ${config.singular}`;

  const body = `
    <form class="advogado-form" id="advogado-record-form" data-record-id="${escapeHtml(record?.id || '')}">
      <div class="advogado-form-top-actions">
        ${supportsInlineQuickClient ? '<button type="button" class="btn btn-ghost btn-sm" data-advogado-toggle-quick-client>Novo cliente PF/PJ</button>' : ''}
        <button type="button" class="btn btn-ghost btn-sm" data-advogado-toggle-advanced>Ver mais</button>
      </div>
      <div class="advogado-form-grid">
        ${config.fields.map(field => renderField(field, record || {}, state.moduleKey)).join('')}
        <label class="ui-field advogado-form-field">
          <span class="ui-label">Status</span>
          <select class="ui-select" name="status" ${canEdit ? '' : 'disabled'}>
            ${config.status.map(status => `
              <option value="${escapeHtml(status)}" ${(record?.status || config.status[0]) === status ? 'selected' : ''}>${escapeHtml(normalizeStatusLabel(status))}</option>
            `).join('')}
          </select>
        </label>
      </div>
      ${supportsInlineQuickClient ? `
        <section class="advogado-quick-client" data-advogado-quick-client hidden>
          <h3 class="advogado-quick-client-title">Cadastrar cliente e associar automaticamente</h3>
          <div class="advogado-form-grid">
            <label class="ui-field advogado-form-field">
              <span class="ui-label">Tipo pessoa</span>
              <select class="ui-select" name="quick_cliente_tipo_pessoa">
                <option value="PF">PF</option>
                <option value="PJ">PJ</option>
              </select>
            </label>
            <label class="ui-field advogado-form-field">
              <span class="ui-label">Nome</span>
              <input class="ui-input" name="quick_cliente_nome" type="text">
            </label>
            <label class="ui-field advogado-form-field">
              <span class="ui-label">CPF</span>
              <input class="ui-input" name="quick_cliente_cpf" type="text">
            </label>
            <label class="ui-field advogado-form-field">
              <span class="ui-label">CNPJ</span>
              <input class="ui-input" name="quick_cliente_cnpj" type="text">
            </label>
            <label class="ui-field advogado-form-field">
              <span class="ui-label">E-mail</span>
              <input class="ui-input" name="quick_cliente_email" type="email">
            </label>
            <label class="ui-field advogado-form-field">
              <span class="ui-label">WhatsApp</span>
              <input class="ui-input" name="quick_cliente_whatsapp" type="text">
            </label>
          </div>
          <p class="advogado-form-hint">Se nenhum cliente existente for selecionado, o cadastro rápido será usado no vínculo.</p>
        </section>
      ` : ''}
      ${canEdit ? '' : '<p class="advogado-form-hint">Registro vindo do Supabase. Crie um acompanhamento local para editar informações operacionais.</p>'}
      <div class="advogado-form-actions">
        <button type="button" class="btn btn-ghost" data-advogado-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary" ${canEdit ? '' : 'disabled'}>Salvar</button>
      </div>
    </form>
  `;

  window.shellModal?.open?.({ title, body });
  const form = document.getElementById('advogado-record-form');
  form?.classList.remove('show-advanced');
  form?.querySelector('[data-advogado-toggle-advanced]')?.addEventListener('click', () => {
    const visible = form.classList.toggle('show-advanced');
    const button = form.querySelector('[data-advogado-toggle-advanced]');
    if (button) button.textContent = visible ? 'Ver menos' : 'Ver mais';
  });
  form?.querySelector('[data-advogado-toggle-quick-client]')?.addEventListener('click', () => {
    const section = form.querySelector('[data-advogado-quick-client]');
    if (!section) return;
    const shouldShow = section.hasAttribute('hidden');
    if (shouldShow) section.removeAttribute('hidden');
    else section.setAttribute('hidden', 'hidden');
    const button = form.querySelector('[data-advogado-toggle-quick-client]');
    if (button) button.textContent = shouldShow ? 'Fechar novo cliente' : 'Novo cliente PF/PJ';
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    const quickClientName = String(payload.quick_cliente_nome || '').trim();
    const selectedClient = String(payload.cliente_user_id || payload.cliente_id || '').trim();
    const shouldCreateQuickClient = supportsInlineQuickClient && !selectedClient && quickClientName;

    if (shouldCreateQuickClient) {
      const quickClientPayload = {
        tipo_pessoa: payload.quick_cliente_tipo_pessoa || 'PF',
        nome: quickClientName,
        full_name: quickClientName,
        cpf: payload.quick_cliente_cpf || '',
        cnpj: payload.quick_cliente_cnpj || '',
        email: payload.quick_cliente_email || '',
        whatsapp: payload.quick_cliente_whatsapp || '',
        status: 'em_onboarding',
      };

      const createdClient = await saveAdvogadoRecord('clientes', quickClientPayload);
      const linkedClientId = createdClient?.user_id || createdClient?.email || createdClient?.nome || createdClient?.id || quickClientPayload.email || quickClientName;
      if (payload.cliente_user_id !== undefined) payload.cliente_user_id = linkedClientId;
      if (payload.cliente_id !== undefined) payload.cliente_id = linkedClientId;
    }

    Object.keys(payload).forEach((key) => {
      if (key.startsWith('quick_cliente_')) delete payload[key];
    });

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
  const shouldShow360 = ['processos', 'clientes', 'documentos', 'tarefas', 'agenda', 'financeiro'].includes(state.moduleKey);
  let view360 = '';
  if (shouldShow360) {
    const modules360 = ['clientes', 'processos', 'documentos', 'tarefas', 'agenda', 'financeiro', 'partes'];
    const references = [
      record.cliente_user_id,
      record.cliente_id,
      record.user_id,
      record.processo_id,
      record.numero_cnj,
      record.cliente,
      record.nome,
    ].filter(Boolean).map(value => String(value).toLowerCase());

    const related = await Promise.all(modules360.map(async (moduleKey) => {
      try {
        const rows = await listAdvogadoRecords(moduleKey);
        const count = rows.filter((row) => {
          if (row.id === record.id && moduleKey === state.moduleKey) return false;
          return Object.values(row).some(value => references.some(ref => String(value ?? '').toLowerCase().includes(ref)));
        }).length;
        return { moduleKey, count };
      } catch (_) {
        return { moduleKey, count: 0 };
      }
    }));

    view360 = `
      <div class="advogado-audit-box">
        <h3>Integração 360</h3>
        ${related.map((item) => `
          <div class="advogado-audit-item">
            <strong>${escapeHtml(getAdvogadoModuleConfig(item.moduleKey)?.title || item.moduleKey)}</strong>
            <span>${item.count} vínculo(s)</span>
            <a class="btn btn-ghost btn-sm" href="${escapeHtml(getModuleHref(item.moduleKey))}">Abrir módulo</a>
          </div>
        `).join('')}
      </div>
    `;
  }
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
      ${view360}
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
        <h2>Nenhum item nesta visão</h2>
        <p>Crie um novo registro ou ajuste os filtros para retomar o acompanhamento.</p>
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
                ${state.moduleKey === 'clientes' ? '<button type="button" class="btn btn-ghost btn-sm" data-action="invite">Convidar acesso</button>' : ''}
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

  const isPartes = state.moduleKey === 'partes';
  const filtered = filterAdvogadoRecords(state.records, {
    query: state.query,
    status: state.status,
    archived: state.archived,
    processoId: isPartes ? state.processoId : '',
    planoPagamentoId: isPartes ? state.planoPagamentoId : '',
    clienteUserId: isPartes ? state.clienteUserId : '',
    vinculoStatus: isPartes ? state.vinculoStatus : 'todos',
  });
  const paginated = paginateAdvogadoRecords(filtered, state.page, state.pageSize);
  state.page = paginated.page;
  return { config, paginated };
}

function renderPartesAdvancedFilters() {
  if (state.moduleKey !== 'partes') return '';
  return `
    <label class="ui-field">
      <span class="ui-label">Processo ID</span>
      <input class="ui-input" type="search" value="${escapeHtml(state.processoId)}" data-advogado-filter="processoId" placeholder="Filtrar por processo">
    </label>
    <label class="ui-field">
      <span class="ui-label">Plano ID</span>
      <input class="ui-input" type="search" value="${escapeHtml(state.planoPagamentoId)}" data-advogado-filter="planoPagamentoId" placeholder="Filtrar por plano">
    </label>
    <label class="ui-field">
      <span class="ui-label">Cliente User ID</span>
      <input class="ui-input" type="search" value="${escapeHtml(state.clienteUserId)}" data-advogado-filter="clienteUserId" placeholder="Filtrar por cliente">
    </label>
    <label class="ui-field">
      <span class="ui-label">Vínculo</span>
      <select class="ui-select" data-advogado-filter="vinculoStatus">
        <option value="todos" ${state.vinculoStatus === 'todos' ? 'selected' : ''}>Todos</option>
        <option value="ativo" ${state.vinculoStatus === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="inativo" ${state.vinculoStatus === 'inativo' ? 'selected' : ''}>Inativo</option>
      </select>
    </label>
  `;
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
        <button type="button" class="btn btn-primary" data-advogado-action="create">Criar ${escapeHtml(config.singular)}</button>
      </div>

      <div class="advogado-kpis">
        <div class="ui-stat-card"><span>Ativos</span><strong>${activeCount}</strong><small>em acompanhamento</small></div>
        <div class="ui-stat-card"><span>Pendências</span><strong>${pendingCount}</strong><small>exigem revisão</small></div>
        <div class="ui-stat-card"><span>Arquivados</span><strong>${archivedCount}</strong><small>histórico preservado</small></div>
        <div class="ui-stat-card"><span>Filtrados</span><strong data-advogado-kpi="filtered">${paginated.total}</strong><small>na visão atual</small></div>
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
        ${renderPartesAdvancedFilters()}
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
  const countOpen = (key, doneStatuses = ['concluida', 'concluido', 'realizado', 'aprovado', 'assinado', 'arquivado']) =>
    (recordMap[key] || []).filter(record => !record.archived && !doneStatuses.includes(String(record.status || '').toLowerCase())).length;
  const routineCards = [
    {
      key: 'documentos',
      title: 'Documentos e assinaturas',
      count: countOpen('documentos', ['aprovado', 'assinado', 'arquivado']),
      copy: 'Revisar pendências, correções e itens enviados para assinatura.',
      cta: 'Abrir documentos',
    },
    {
      key: 'prazos',
      title: 'Prazos do dia',
      count: countOpen('prazos'),
      copy: 'Conferir prazos processuais, alertas e responsáveis.',
      cta: 'Ver prazos',
    },
    {
      key: 'publicacoes',
      title: 'Publicações',
      count: countOpen('publicacoes'),
      copy: 'Tratar publicações novas, ciência interna e providências.',
      cta: 'Ver publicações',
    },
    {
      key: 'tarefas',
      title: 'Follow-up',
      count: countOpen('tarefas'),
      copy: 'Organizar tarefas abertas e próximos contatos com clientes.',
      cta: 'Ver tarefas',
    },
  ];

  const moduleCards = ADMIN_PAGE_KEYS.map(key => {
    const config = ADVOGADO_MODULES[key];
    const records = recordMap[key] || [];
    const active = records.filter(record => !record.archived).length;
    return `
      <a class="advogado-module-card" href="${key}.html" data-page="${key}">
        <span>${escapeHtml(config.title)}</span>
        <strong>${active}</strong>
        <small>item(ns) ativos</small>
      </a>
    `;
  }).join('');

  host.innerHTML = `
    <section class="advogado-page advogado-painel">
      <div class="page-header page-header-row advogado-header">
        <div>
          <h1>Painel</h1>
          <p>Operação jurídica do escritório com foco em clientes, prazos, documentos e próximos atos.</p>
        </div>
        <a class="btn btn-primary" href="clientes.html" data-page="clientes">Novo atendimento</a>
      </div>

      <div class="advogado-kpis">
        <div class="ui-stat-card"><span>Clientes</span><strong>${state.remoteClients.length}</strong><small>casos vinculados</small></div>
        <div class="ui-stat-card"><span>Pendências ativas</span><strong>${totals.total}</strong><small>em operação</small></div>
        <div class="ui-stat-card"><span>Arquivados</span><strong>${totals.archived}</strong><small>histórico</small></div>
        <div class="ui-stat-card"><span>Módulos operacionais</span><strong>${ADMIN_PAGE_KEYS.length}</strong><small>conectados</small></div>
      </div>

      <section class="advogado-routine sec">
        <div class="advogado-routine-head">
          <div>
            <span>Rotina guiada</span>
            <h2>Prioridades do escritório</h2>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-shell-action="workspace-panel">Abrir notificações</button>
        </div>
        <div class="advogado-routine-grid">
          ${routineCards.map(card => `
            <a class="advogado-routine-card" href="${escapeHtml(getModuleHref(card.key))}" data-page="${escapeHtml(card.key)}">
              <div>
                <span>${escapeHtml(card.title)}</span>
                <strong>${card.count}</strong>
              </div>
              <p>${escapeHtml(card.copy)}</p>
              <small>${escapeHtml(card.cta)}</small>
            </a>
          `).join('')}
        </div>
      </section>

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
    if (!filter) return;
    if (filter === 'query') state.query = event.target.value;
    if (filter === 'processoId') state.processoId = event.target.value;
    if (filter === 'planoPagamentoId') state.planoPagamentoId = event.target.value;
    if (filter === 'clienteUserId') state.clienteUserId = event.target.value;
    if (!['query', 'processoId', 'planoPagamentoId', 'clienteUserId'].includes(filter)) return;
    state.page = 1;
    clearTimeout(queryRenderTimer);
    queryRenderTimer = setTimeout(() => refreshList(host), 120);
  });

  host.addEventListener('change', event => {
    const filter = event.target?.dataset?.advogadoFilter;
    if (!filter) return;
    if (filter === 'status') state.status = event.target.value;
    if (filter === 'archived') state.archived = event.target.value === 'arquivados';
    if (filter === 'vinculoStatus') state.vinculoStatus = event.target.value;
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
    if (actionButton.dataset.action === 'invite') {
      const email = String(record.email || '').trim();
      if (!email) {
        window.shellNotify?.({
          title: 'Convite não enviado',
          text: 'Cliente sem e-mail cadastrado. Atualize o cadastro antes de convidar.',
          tone: 'warn',
        });
        return;
      }

      AdminService.sendClientInvite({
        email,
        userId: record.user_id || null,
        workspaceId: record.workspace_id || null,
      }).then(() => {
        window.shellNotify?.({
          title: 'Convite enviado',
          text: `Link de acesso enviado para ${email}.`,
          tone: 'brand',
        });
      }).catch((error) => {
        window.shellNotify?.({
          title: 'Falha ao enviar convite',
          text: error?.message || 'Tente novamente em instantes.',
          tone: 'warn',
        });
      });
    }
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

async function loadInternalUsers() {
  try {
    state.internalUsers = await AdminService.getInternalUsers();
  } catch (error) {
    state.internalUsers = [];
    window.shellNotify?.({
      title: 'Usuários internos indisponíveis',
      text: error?.message || 'Não foi possível listar responsáveis internos.',
      tone: 'warn',
    });
  }
}

// ── Admin Financeiro Hub ──────────────────────────────────────────────────────

function renderAdminFinanceiroRecordList(records, emptyMsg) {
  if (!records.length) return `<p class="advogado-empty">${escapeHtml(emptyMsg)}</p>`;
  return records.slice(0, 15).map(record => `
    <article class="advogado-record-card">
      <div class="advogado-record-main">
        <strong>${escapeHtml(record.descricao || record.tipo || record.titulo || 'Registro')}</strong>
        <span class="advogado-flow-pill">${escapeHtml(record.status || 'pendente')}</span>
      </div>
      <div class="advogado-detail-row">
        <span>${escapeHtml(record.cliente_nome || record.cliente_id || '-')}</span>
        <strong>${formatMoney(record.valor)}</strong>
      </div>
    </article>
  `).join('');
}

function renderAdminFinanceiroHonorarios(data) {
  const records = data.honRecords;
  const total = records.reduce((sum, record) => sum + Number(record.valor || 0), 0);
  const pending = records.filter(record => ['pendente', 'emitida'].includes(record.status)).length;
  const paid = records.filter(record => ['pago', 'quitado', 'concluido'].includes(record.status)).length;
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Total honorários</span><div class="kpi-value">${formatMoney(total)}</div></div>
      <div class="kpi kpi-warn"><span class="kpi-label">Pendentes</span><div class="kpi-value">${pending}</div></div>
      <div class="kpi kpi-ok"><span class="kpi-label">Quitados</span><div class="kpi-value">${paid}</div></div>
    </div>
    <div class="advogado-record-list" style="margin-top:16px;">
      ${renderAdminFinanceiroRecordList(records, 'Nenhum honorário registrado.')}
    </div>
  `;
}

function renderAdminFinanceiroCobrancas(data) {
  const records = data.cobRecords;
  const total = records.reduce((sum, record) => sum + Number(record.valor || 0), 0);
  const overdue = records.filter(record => ['vencida', 'inadimplente'].includes(record.status)).length;
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Total cobranças</span><div class="kpi-value">${formatMoney(total)}</div></div>
      <div class="kpi kpi-warn"><span class="kpi-label">Em atraso</span><div class="kpi-value">${overdue}</div></div>
      <div class="kpi"><span class="kpi-label">Registros</span><div class="kpi-value">${records.length}</div></div>
    </div>
    <div class="advogado-record-list" style="margin-top:16px;">
      ${renderAdminFinanceiroRecordList(records, 'Nenhuma cobrança registrada.')}
    </div>
  `;
}

function renderAdminFinanceiroAnalise(data) {
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Clientes ativos</span><div class="kpi-value">${data.clients.length}</div></div>
      <div class="kpi"><span class="kpi-label">Diagnóstico</span><div class="kpi-value">Ativo</div><div class="kpi-hint">Comprometimento e renda</div></div>
      <div class="kpi kpi-ok"><span class="kpi-label">Base CNJ</span><div class="kpi-value">Operacional</div></div>
    </div>
    <article class="advogado-record-card" style="margin-top:16px;">
      <h3 style="margin-bottom:8px;">Análise Financeira de Casos</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px;">Renda, mínimo existencial, dívidas e proposta de pagamento por cliente. Acompanhe a evolução do comprometimento e base de negociação.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a class="btn btn-primary btn-sm" href="financeiro-inteligencia.html" data-page="financeiro-inteligencia">Abrir análise completa</a>
        <a class="btn btn-ghost btn-sm" href="financial-dashboard.html" data-page="financial-dashboard">Dashboard financeiro</a>
      </div>
    </article>
  `;
}

function renderAdminFinanceiroDashboard(data) {
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Casos monitorados</span><div class="kpi-value">${data.clients.length}</div></div>
      <div class="kpi kpi-ok"><span class="kpi-label">Dashboard</span><div class="kpi-value">Disponível</div></div>
    </div>
    <article class="advogado-record-card" style="margin-top:16px;">
      <h3 style="margin-bottom:8px;">Dashboard Financeiro</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px;">Visão consolidada de receitas, cobranças, diagnóstico CNJ e planos de pagamento. Inclui gráficos de evolução e alertas de risco financeiro.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a class="btn btn-primary btn-sm" href="financial-dashboard.html" data-page="financial-dashboard">Abrir dashboard completo</a>
        <a class="btn btn-ghost btn-sm" href="financeiro-inteligencia.html" data-page="financeiro-inteligencia">Análise financeira</a>
      </div>
    </article>
  `;
}

function renderAdminFinanceiroTab(tabKey, data) {
  switch (tabKey) {
    case 'cobrancas':    return renderAdminFinanceiroCobrancas(data);
    case 'inteligencia': return renderAdminFinanceiroAnalise(data);
    case 'dashboard':    return renderAdminFinanceiroDashboard(data);
    default:             return renderAdminFinanceiroHonorarios(data);
  }
}

async function renderAdminFinanceiroHub(host) {
  const tabs = [
    { key: 'honorarios',   label: 'Honorários' },
    { key: 'cobrancas',    label: 'Cobranças' },
    { key: 'inteligencia', label: 'Análise' },
    { key: 'dashboard',    label: 'Dashboard' },
  ];
  const hash = (window.location.hash || '').replace('#', '');
  const activeTab = tabs.some(t => t.key === hash) ? hash : 'honorarios';

  const [honRecords, cobRecords, clients] = await Promise.all([
    loadModuleRecords('financeiro').catch(() => []),
    loadModuleRecords('financeiro-processual').catch(() => []),
    AdminService.getClients().catch(() => []),
  ]);

  const hubData = { honRecords, cobRecords, clients };

  host.innerHTML = `
    <section class="advogado-page" data-advogado-module="financeiro">
      <div class="page-header">
        <h1>Financeiro</h1>
        <p>Honorários, cobranças, análise e diagnóstico financeiro dos casos.</p>
      </div>
      <nav class="hub-tabs" aria-label="Abas financeiro">
        ${tabs.map(t => `
          <a class="hub-tab${t.key === activeTab ? ' is-active' : ''}"
             href="#${t.key}" data-hub-tab="${t.key}">${escapeHtml(t.label)}</a>
        `).join('')}
      </nav>
      <div class="hub-tab-content">${renderAdminFinanceiroTab(activeTab, hubData)}</div>
    </section>
  `;
  window.initUiKit?.(host);

  host.querySelectorAll('[data-hub-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabKey = link.dataset.hubTab;
      window.history.replaceState(null, '', `#${tabKey}`);
      host.querySelectorAll('.hub-tab').forEach(a => a.classList.toggle('is-active', a.dataset.hubTab === tabKey));
      const contentEl = host.querySelector('.hub-tab-content');
      if (contentEl) {
        contentEl.innerHTML = renderAdminFinanceiroTab(tabKey, hubData);
        window.initUiKit?.(contentEl);
      }
    });
  });
}

export async function bootAdvogadoPage(moduleKey) {
  const host = document.querySelector('[data-advogado-module-host]');
  if (!host) return;

  await loadRemoteClients();
  await loadInternalUsers();

  if (moduleKey === 'painel') {
    await renderPainelPage(host);
    window.initUiKit?.(host);
    bindPainelEvents(host);
    return;
  }

  if (moduleKey === 'financeiro') {
    await renderAdminFinanceiroHub(host);
    return;
  }

  state.moduleKey = moduleKey;
  state.query = '';
  state.status = 'todos';
  state.archived = false;
  state.processoId = '';
  state.planoPagamentoId = '';
  state.clienteUserId = '';
  state.vinculoStatus = 'todos';
  state.page = 1;
  state.records = await loadModuleRecords(moduleKey);

  renderInto(host);
  bindModuleEvents(host);
}
