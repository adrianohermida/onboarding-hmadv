import { AdminService } from '../../services/database.js';
import { supabase } from '../../services/supabase.js';

const KNOWN_SCHEMAS = [
  {
    name: 'public',
    label: 'Público',
    description: 'Casos, documentos, usuários e dados principais do portal.',
    tables: ['profiles', 'casos', 'portal_documentos', 'portal_dividas', 'portal_contratos',
             'portal_operational_records', 'portal_operational_record_audit',
             'portal_custas_processuais', 'portal_financeiro_processual', 'portal_planos_pagamento'],
  },
  {
    name: 'judiciario',
    label: 'Judiciário',
    description: 'Processos, publicações, audiências, prazos e andamentos jurídicos.',
    tables: ['processos', 'publicacoes', 'audiencias', 'prazo_tarefa', 'partes_processuais',
             'relacoes_processuais', 'orgaos_judiciarios', 'tpu', 'serventias', 'movimentacoes'],
  },
  {
    name: 'storage',
    label: 'Armazenamento',
    description: 'Buckets e objetos do Supabase Storage.',
    tables: ['buckets', 'objects'],
  },
];

const KNOWN_INTEGRATIONS = [
  { name: 'Supabase Auth',     status: 'ativo', description: 'Autenticação e gestão de usuários do portal.' },
  { name: 'Supabase Storage',  status: 'ativo', description: 'Armazenamento de documentos e arquivos vinculados a casos.' },
  { name: 'Supabase Realtime', status: 'ativo', description: 'Assinaturas em tempo real para mensagens e notificações.' },
  { name: 'Freshdesk',         status: 'ativo', description: 'Central de atendimento e chamados de suporte externo.' },
  { name: 'Edge Functions',    status: 'ativo', description: 'Funções serverless para automação, busca e webhooks.' },
];

const KNOWN_AUTOMATIONS = [
  { name: 'global-search',   type: 'Edge Function', description: 'Busca global full-text em todas as entidades do portal.' },
  { name: 'notifications',   type: 'Edge Function', description: 'Envio de notificações e alertas automáticos por evento.' },
  { name: 'pg_trgm',         type: 'Extensão',      description: 'Índices trigramas para busca textual avançada no PostgreSQL.' },
  { name: 'uuid-ossp',       type: 'Extensão',      description: 'Geração de UUIDs para identificadores únicos.' },
  { name: 'Row Level Security', type: 'Política',   description: 'Isolamento de dados por usuário e tenant em todos os schemas.' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderGestaoHubNav(activeTab) {
  const tabs = [
    { key: 'estruturas',  label: 'Estruturas' },
    { key: 'integracoes', label: 'Integrações' },
    { key: 'automacao',   label: 'Automação' },
    { key: 'auditoria',   label: 'Auditoria' },
  ];
  return `
    <nav class="hub-tabs" aria-label="Abas de gestão">
      ${tabs.map(t => `
        <a class="hub-tab${t.key === activeTab ? ' is-active' : ''}"
           href="#${t.key}" data-hub-tab="${t.key}">${escapeHtml(t.label)}</a>
      `).join('')}
    </nav>
  `;
}

function renderEstruturasTab(stats) {
  const total = KNOWN_SCHEMAS.reduce((s, schema) => s + schema.tables.length, 0);
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Schemas</span><div class="kpi-value">${KNOWN_SCHEMAS.length}</div></div>
      <div class="kpi"><span class="kpi-label">Tabelas</span><div class="kpi-value">${total}</div></div>
      <div class="kpi kpi-ok"><span class="kpi-label">Clientes ativos</span><div class="kpi-value">${stats.clients}</div><div class="kpi-hint">Registros no portal</div></div>
    </div>
    ${KNOWN_SCHEMAS.map(schema => `
      <section class="advogado-record-card" style="margin-top:16px;">
        <div class="advogado-record-main">
          <strong>${escapeHtml(schema.label)}</strong>
          <code style="font-size:11px;background:var(--surface-raised);padding:2px 6px;border-radius:4px;">${escapeHtml(schema.name)}</code>
        </div>
        <p style="color:var(--muted);font-size:13px;margin:6px 0 10px;">${escapeHtml(schema.description)}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${schema.tables.map(table => `
            <code style="background:var(--surface-raised);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--muted);">${escapeHtml(table)}</code>
          `).join('')}
        </div>
      </section>
    `).join('')}
  `;
}

function renderIntegracoesTab() {
  const ativos = KNOWN_INTEGRATIONS.filter(i => i.status === 'ativo').length;
  return `
    <div class="kpi-grid">
      <div class="kpi kpi-ok"><span class="kpi-label">Ativas</span><div class="kpi-value">${ativos}</div><div class="kpi-hint">de ${KNOWN_INTEGRATIONS.length} configuradas</div></div>
      <div class="kpi"><span class="kpi-label">Status geral</span><div class="kpi-value">OK</div></div>
    </div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
      ${KNOWN_INTEGRATIONS.map(integration => `
        <section class="advogado-record-card">
          <div class="advogado-record-main">
            <strong>${escapeHtml(integration.name)}</strong>
            <span class="advogado-flow-pill">${escapeHtml(integration.status)}</span>
          </div>
          <p style="color:var(--muted);font-size:13px;margin-top:4px;">${escapeHtml(integration.description)}</p>
        </section>
      `).join('')}
    </div>
  `;
}

function renderAutomacaoTab() {
  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Automações</span><div class="kpi-value">${KNOWN_AUTOMATIONS.length}</div></div>
      <div class="kpi kpi-ok"><span class="kpi-label">Status</span><div class="kpi-value">Operacional</div></div>
    </div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
      ${KNOWN_AUTOMATIONS.map(automation => `
        <section class="advogado-record-card">
          <div class="advogado-record-main">
            <strong>${escapeHtml(automation.name)}</strong>
            <span class="advogado-flow-pill">${escapeHtml(automation.type)}</span>
          </div>
          <p style="color:var(--muted);font-size:13px;margin-top:4px;">${escapeHtml(automation.description)}</p>
        </section>
      `).join('')}
    </div>
  `;
}

async function fetchAuditEvents() {
  try {
    const { data } = await supabase
      .from('portal_operational_record_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  } catch {
    return [];
  }
}

function renderAuditoriaTab(events) {
  const rows = events.length
    ? events.map(event => `
      <section class="advogado-record-card">
        <div class="advogado-record-main">
          <strong>${escapeHtml(event.action || event.event_type || 'Evento')}</strong>
          <span class="advogado-flow-pill">${escapeHtml(event.module_key || event.table_name || '-')}</span>
        </div>
        <div class="advogado-detail-row">
          <span>${escapeHtml(event.user_id || '-')}</span>
          <small>${escapeHtml(new Date(event.created_at).toLocaleString('pt-BR'))}</small>
        </div>
      </section>
    `).join('')
    : '<p style="color:var(--muted);padding:16px 0;">Nenhum evento de auditoria registrado ainda.</p>';

  return `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Eventos</span><div class="kpi-value">${events.length}</div><div class="kpi-hint">Últimos 20</div></div>
      <div class="kpi"><span class="kpi-label">Auditoria</span><div class="kpi-value">Ativa</div></div>
    </div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">${rows}</div>
  `;
}

function renderGestaoTab(tabKey, cache) {
  switch (tabKey) {
    case 'integracoes': return renderIntegracoesTab();
    case 'automacao':   return renderAutomacaoTab();
    case 'auditoria':   return renderAuditoriaTab(cache.auditEvents);
    default:            return renderEstruturasTab(cache.stats);
  }
}

export async function bootGestaoPage() {
  const host = document.querySelector('[data-gestao-host]');
  if (!host) return;

  host.innerHTML = '<section class="advogado-record-card" style="color:var(--muted);padding:20px;">Carregando gestão...</section>';

  const hash = (window.location.hash || '').replace('#', '');
  const validTabs = ['estruturas', 'integracoes', 'automacao', 'auditoria'];
  const activeTab = validTabs.includes(hash) ? hash : 'estruturas';

  const [clients, auditEvents] = await Promise.all([
    AdminService.getClients().catch(() => []),
    fetchAuditEvents(),
  ]);

  const cache = { stats: { clients: clients.length }, auditEvents };

  host.innerHTML = `
    <section>
      <div class="page-header">
        <h1>Gestão</h1>
        <p>Estruturas de dados, integrações, automação e auditoria do portal.</p>
      </div>
      ${renderGestaoHubNav(activeTab)}
      <div class="hub-tab-content" id="gestao-content">${renderGestaoTab(activeTab, cache)}</div>
    </section>
  `;
  window.initUiKit?.(host);

  host.querySelectorAll('[data-hub-tab]').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const tabKey = link.dataset.hubTab;
      window.history.replaceState(null, '', `#${tabKey}`);
      host.querySelectorAll('.hub-tab').forEach(a => a.classList.toggle('is-active', a.dataset.hubTab === tabKey));
      const contentEl = host.querySelector('#gestao-content');
      if (!contentEl) return;
      if (tabKey === 'auditoria') {
        cache.auditEvents = await fetchAuditEvents();
      }
      contentEl.innerHTML = renderGestaoTab(tabKey, cache);
      window.initUiKit?.(contentEl);
    });
  });
}
