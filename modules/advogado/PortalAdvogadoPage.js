import { AdminService } from '../../services/database.js';
import {
  ADVOGADO_MODULES,
  archiveAdvogadoRecord,
  deleteAdvogadoRecord,
  filterAdvogadoRecords,
  getAdvogadoModuleConfig,
  listAdvogadoRecords,
  listAdvogadoTimeline,
  paginateAdvogadoRecords,
  saveAdvogadoRecord,
} from './RegistroAdvogadoService.js';

const ADMIN_PAGE_KEYS = ['clientes', 'planos', 'processos', 'tarefas', 'agenda', 'mensagens', 'financeiro'];

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
  const local = listAdvogadoRecords(moduleKey);
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
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    saveAdvogadoRecord(state.moduleKey, payload, isEdit ? record.id : null);
    window.shellModal?.close?.();
    refreshRecords();
  });
  form?.querySelector('[data-advogado-close-modal]')?.addEventListener('click', () => window.shellModal?.close?.());
}

function openTimeline(record) {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  const events = listAdvogadoTimeline(state.moduleKey, record.id);
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
    <div class="advogado-record-list">
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

function renderModulePage() {
  const config = getAdvogadoModuleConfig(state.moduleKey);
  if (!config) return '';

  const filtered = filterAdvogadoRecords(state.records, {
    query: state.query,
    status: state.status,
    archived: state.archived,
  });
  const paginated = paginateAdvogadoRecords(filtered, state.page, state.pageSize);
  state.page = paginated.page;

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
        <div class="ui-stat-card"><span>Total filtrado</span><strong>${paginated.total}</strong></div>
      </div>

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

      <div class="advogado-pagination">
        <span>${paginated.total} registro(s)</span>
        <div>
          <button type="button" class="btn btn-ghost btn-sm" data-advogado-page="prev" ${paginated.page <= 1 ? 'disabled' : ''}>Anterior</button>
          <span>Página ${paginated.page} de ${paginated.pages}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-advogado-page="next" ${paginated.page >= paginated.pages ? 'disabled' : ''}>Próxima</button>
        </div>
      </div>
    </section>
  `;
}

function renderPainelPage(host) {
  const totals = ADMIN_PAGE_KEYS.reduce((acc, key) => {
    const records = key === 'clientes' ? localRecordsWithRemoteClients(key) : listAdvogadoRecords(key);
    acc.total += records.filter(record => !record.archived).length;
    acc.archived += records.filter(record => record.archived).length;
    return acc;
  }, { total: 0, archived: 0 });

  const moduleCards = ADMIN_PAGE_KEYS.map(key => {
    const config = ADVOGADO_MODULES[key];
    const records = key === 'clientes' ? localRecordsWithRemoteClients(key) : listAdvogadoRecords(key);
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
        <div class="ui-stat-card"><span>Módulos</span><strong>${ADMIN_PAGE_KEYS.length + 2}</strong></div>
      </div>

      <div class="advogado-workspace-grid">
        ${moduleCards}
        <a class="advogado-module-card" href="documentos.html" data-page="documentos">
          <span>Documentos</span>
          <strong>CRUD</strong>
          <small>workflow documental existente</small>
        </a>
        <a class="advogado-module-card" href="dividas.html" data-page="dividas">
          <span>Dívidas</span>
          <strong>CRUD</strong>
          <small>cadastro financeiro existente</small>
        </a>
      </div>
    </section>
  `;
}

function bindModuleEvents(host) {
  host.addEventListener('input', event => {
    const filter = event.target?.dataset?.advogadoFilter;
    if (filter !== 'query') return;
    state.query = event.target.value;
    state.page = 1;
    renderInto(host);
  });

  host.addEventListener('change', event => {
    const filter = event.target?.dataset?.advogadoFilter;
    if (!filter) return;
    if (filter === 'status') state.status = event.target.value;
    if (filter === 'archived') state.archived = event.target.value === 'arquivados';
    state.page = 1;
    renderInto(host);
  });

  host.addEventListener('click', event => {
    const createButton = event.target.closest('[data-advogado-action="create"]');
    if (createButton) {
      openRecordForm();
      return;
    }

    const pageButton = event.target.closest('[data-advogado-page]');
    if (pageButton) {
      state.page += pageButton.dataset.advogadoPage === 'next' ? 1 : -1;
      renderInto(host);
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    const card = event.target.closest('[data-record-id]');
    if (!actionButton || !card) return;

    const record = state.records.find(item => item.id === card.dataset.recordId);
    if (!record) return;

    if (actionButton.dataset.action === 'timeline') openTimeline(record);
    if (actionButton.dataset.action === 'edit') openRecordForm(record);
    if (actionButton.dataset.action === 'archive') {
      archiveAdvogadoRecord(state.moduleKey, record.id);
      refreshRecords();
    }
    if (actionButton.dataset.action === 'delete') {
      deleteAdvogadoRecord(state.moduleKey, record.id);
      refreshRecords();
    }
  });
}

function renderInto(host) {
  host.innerHTML = renderModulePage();
  window.initUiKit?.(host);
}

function refreshRecords() {
  state.records = localRecordsWithRemoteClients(state.moduleKey);
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
    renderPainelPage(host);
    window.initUiKit?.(host);
    return;
  }

  state.moduleKey = moduleKey;
  state.query = '';
  state.status = 'todos';
  state.archived = false;
  state.page = 1;
  state.records = localRecordsWithRemoteClients(moduleKey);

  renderInto(host);
  bindModuleEvents(host);
}
