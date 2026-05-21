/**
 * Helpers puros de UI do módulo Documentos.
 *
 * Mantém a página menor e concentra escapes/ícones/formatadores em um lugar
 * reutilizável pelos próximos componentes do módulo.
 */

export function esc(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

export function icon(name, { size = 16, color = 'currentColor', strokeWidth = 1.5 } = {}) {
  if (window.lucide?.icons?.[name]) {
    return window.lucide.icons[name].toSvg({
      width: size,
      height: size,
      stroke: color,
      'stroke-width': strokeWidth,
      fill: 'none',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="2" fill="${color}" opacity=".7"/></svg>`;
}

export function timeAgo(timestamp) {
  if (!timestamp) return '—';

  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `${minutes}min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export function renderDocumentCard(doc, {
  workflowStates,
  categories,
  canUpload = false,
  canView = false,
  adminMode = false,
} = {}) {
  const states = workflowStates || {};
  const cats = categories || {};
  const workflow = states[doc.workflow_status] || states.pendente_envio || {
    label: 'Pendente',
    color: '#94a3b8',
    bg: '#f8fafc',
    icon: 'clock',
  };

  const noteHtml = doc.observacao_admin
    ? `<div class="doc-card-note">${esc(doc.observacao_admin)}</div>`
    : '';

  const adminNoteHtml = adminMode && doc.admin_notes
    ? `<div class="doc-card-note is-admin">${icon('lock', { size: 11, color: '#6b7280' })} ${esc(doc.admin_notes)}</div>`
    : '';

  const metaHtml = doc.nome_arquivo
    ? `<div class="doc-card-filename">${icon('paperclip', { size: 11, color: 'var(--muted)' })} ${esc(doc.nome_arquivo)} ${doc.file_size ? `<span class="doc-card-size">(${fmtSize(doc.file_size)})</span>` : ''}</div>`
    : '';

  const metaDate = doc.updated_at
    ? `<span>Atualizado: ${timeAgo(doc.updated_at)}</span>`
    : '';

  const version = doc.version > 1 ? `<span>v${doc.version}</span>` : '';
  const ocrReady = doc.ocr_status ? `<span>OCR: ${esc(doc.ocr_status === 'ready' ? 'preparado' : doc.ocr_status)}</span>` : '';
  const category = cats[doc.category] || {};

  let actions = '';
  if (canUpload) {
    actions += `<button class="doc-act-btn primary" onclick="triggerUpload('${esc(doc.tipo)}')">${icon('upload-cloud', { size: 13, color: '#fff' })} Enviar</button>`;
  }
  if (canView) {
    actions += `<button class="doc-act-btn" onclick="openDrawer('${esc(doc.id || doc.tipo)}')">${icon('eye', { size: 13, color: 'var(--ink2)' })} Ver</button>`;
  }
  if (adminMode) {
    actions += `<button class="doc-act-btn warn" onclick="openDrawer('${esc(doc.id || doc.tipo)}', true)">${icon('clipboard-check', { size: 13, color: '#fff' })} Avaliar</button>`;
    if (doc.storage_path && doc.workflow_status === 'aprovado') {
      actions += `<button class="doc-act-btn purple" onclick="openSigModal('${esc(doc.id)}')">${icon('pen-line', { size: 13, color: '#fff' })} Assinar</button>`;
    }
  }

  if (!actions) {
    actions = '<span class="doc-card-no-actions">Nenhuma ação disponível</span>';
  }

  return `
    <div class="doc-card status-${esc(doc.workflow_status)}" id="card-${esc(doc.tipo)}">
      <div class="doc-card-top">
        <div class="doc-card-icon">${icon(doc.icon || 'file-text', { size: 20, color: category.color || 'var(--blue)' })}</div>
        <div class="doc-card-header">
          <div class="doc-card-title">${esc(doc.label)}</div>
          <div class="doc-card-cat">${esc(category.label || doc.category || '—')}</div>
          ${metaHtml}
        </div>
        <div class="doc-card-status">
          <div class="doc-status-badge" style="background:${workflow.bg};color:${workflow.color};">
            ${icon(workflow.icon, { size: 11, color: workflow.color })} ${esc(workflow.label)}
          </div>
          <span class="${doc.required ? 'doc-required-pill' : 'doc-optional-pill'}">${doc.required ? 'Obrigatório' : 'Opcional'}</span>
        </div>
      </div>
      ${noteHtml}${adminNoteHtml}
      ${metaDate || version || ocrReady ? `<div class="doc-card-meta">${metaDate}${version}${ocrReady}</div>` : ''}
      <div class="doc-upload-progress" id="prog-${esc(doc.tipo)}">
        <div class="doc-upload-fill" id="prog-fill-${esc(doc.tipo)}"></div>
      </div>
      <div class="doc-card-divider"></div>
      <div class="doc-card-actions">${actions}</div>
    </div>
  `;
}

export function renderDocumentTimeline(events, doc, workflowStates = {}) {
  let rows = Array.isArray(events) ? events : [];
  if (!rows.length) {
    const workflow = workflowStates[doc.workflow_status];
    rows = [{
      evento_tipo: doc.workflow_status,
      descricao: `Status atual: ${workflow?.label || '—'}`,
      created_at: doc.updated_at,
    }];
  }

  const timelineIcons = {
    'document.enviado': 'UP',
    'document.aprovado': 'OK',
    'document.rejeitado': 'NO',
    'document.em_analise': 'AN',
    'document.arquivado': 'ARQ',
    'signature.requested': 'SIG',
    'signature.completed': 'DONE',
    'document.comment': 'COM',
    'document.viewed': 'VIS',
  };

  return rows.map(event => `
    <div class="timeline-item">
      <div class="tl-dot">${timelineIcons[event.evento_tipo] || 'LOG'}</div>
      <div class="tl-body">
        <div class="tl-event">${esc(event.descricao)}</div>
        <div class="tl-meta">${event.author_name ? `${esc(event.author_name)} · ` : ''}${timeAgo(event.created_at)}</div>
        ${event.payload?.observacao ? `<div class="tl-note">${esc(event.payload.observacao)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

export function renderOfficeDocumentsSection(docs, renderCard) {
  const officeDocs = docs.filter(doc => doc.direction === 'office_to_client');
  if (!officeDocs.length) return '';

  return `
    <div class="cat-section" id="cat-office-to-client">
      <div class="cat-section-header cat-section-office">
        <div class="cat-icon">${icon('inbox', { size: 16, color: '#6d28d9' })}</div>
        <div class="cat-title cat-title-office">Documentos do Escritório para Você</div>
        <div class="cat-count cat-count-office">${officeDocs.length} doc${officeDocs.length > 1 ? 's' : ''}</div>
      </div>
      <div class="doc-cards-grid">
        ${officeDocs.map(doc => renderCard(doc)).join('')}
      </div>
    </div>
  `;
}

export function renderDocumentHub({
  allDocs = [],
  activeFilter = 'all',
  categories = {},
  renderCard,
} = {}) {
  const filtered = activeFilter === 'all'
    ? allDocs
    : allDocs.filter(doc => doc.workflow_status === activeFilter ||
        (activeFilter === 'aprovado' && doc.workflow_status === 'assinado'));

  const groupedByCategory = {};
  for (const doc of filtered) {
    const category = doc.category || 'complementares';
    if (!groupedByCategory[category]) groupedByCategory[category] = [];
    groupedByCategory[category].push(doc);
  }

  const hasOfficeDocs = allDocs.some(doc => doc.direction === 'office_to_client');
  if (!Object.keys(groupedByCategory).length && !hasOfficeDocs) {
    return `<div class="doc-empty"><div class="doc-empty-icon">${icon('folder-open', { size: 32, color: 'var(--muted)' })}</div><div>Nenhum documento encontrado.</div></div>`;
  }

  const categoryOrder = [
    'identidade',
    'residencia',
    'financeiro',
    'dividas',
    'contratos',
    'cnj',
    'judiciais',
    'complementares',
  ];

  const categorySections = categoryOrder
    .filter(categoryKey => groupedByCategory[categoryKey])
    .map(categoryKey => {
      const categoryMeta = categories[categoryKey] || {
        label: categoryKey,
        icon: 'folder',
        color: '#6b7280',
      };
      const docs = groupedByCategory[categoryKey];
      const approved = docs.filter(doc => ['aprovado', 'assinado'].includes(doc.workflow_status)).length;
      const categoryPct = docs.length > 0 ? Math.round((approved / docs.length) * 100) : 0;

      return `
        <div class="cat-section" id="cat-${esc(categoryKey)}">
          <div class="cat-section-header">
            <div class="cat-icon">${icon(categoryMeta.icon, { size: 16, color: categoryMeta.color || 'var(--blue)' })}</div>
            <div class="cat-title">${esc(categoryMeta.label)}</div>
            <div class="cat-progress-bar">
              <div class="cat-progress-fill" style="width:${categoryPct}%;background:${categoryMeta.color || 'var(--blue)'}"></div>
            </div>
            <div class="cat-count">${approved}/${docs.length}</div>
          </div>
          <div class="doc-cards-grid">
            ${docs.map(doc => renderCard(doc)).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  return renderOfficeDocumentsSection(allDocs, renderCard) + categorySections;
}

export function renderDocumentRequestsBanner(requests = []) {
  return `
    <div class="requests-banner">
      <div class="requests-banner-icon">${icon('inbox', { size: 24, color: 'rgba(255,255,255,.85)' })}</div>
      <div class="requests-banner-body">
        <div class="requests-banner-title">O escritório solicitou ${requests.length} documento${requests.length > 1 ? 's' : ''}</div>
        <div class="requests-banner-sub">Envie os documentos pendentes para agilizar seu processo.</div>
      </div>
      <div class="request-pill-list">
        ${requests.slice(0, 3).map(request => `
          <span class="request-pill ${request.priority === 'urgent' ? 'urgent' : ''}" onclick="scrollToDoc('${esc(request.document_tipo)}')">
            ${request.priority === 'urgent' ? `${icon('alert-triangle', { size: 12, color: '#fca5a5' })} ` : ''}${esc(request.document_label)}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSignaturePendingCards(docs = []) {
  return docs.map(doc => `
    <div class="sig-card">
      <div class="sig-card-icon">SIG</div>
      <div class="sig-card-body">
        <div class="sig-card-title">${esc(doc.label)}</div>
        <div class="sig-card-meta">${doc.autentique_id ? `ID Autentique: ${esc(doc.autentique_id)}` : 'Aguardando link de assinatura'}</div>
      </div>
      <div class="sig-card-actions">
        ${doc.autentique_id
          ? `<a href="https://app.autentique.com.br/documento/assinar/${esc(doc.autentique_id)}" target="_blank" class="doc-act-btn purple">Assinar agora</a>`
          : ''}
        <button class="doc-act-btn" onclick="openDrawer('${esc(doc.id)}')">Ver detalhes</button>
      </div>
    </div>
  `).join('');
}
