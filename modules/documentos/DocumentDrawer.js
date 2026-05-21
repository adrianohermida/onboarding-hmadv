function byId(id) {
  return document.getElementById(id);
}

export function renderDrawerHeader(doc, categories = {}, workflowStates = {}) {
  const title = byId('drawer-title');
  const subtitle = byId('drawer-subtitle');
  if (title) title.textContent = doc.label;
  if (subtitle) {
    const categoryLabel = categories[doc.category]?.label || '—';
    const workflowLabel = workflowStates[doc.workflow_status]?.label || '—';
    subtitle.textContent = `${categoryLabel} · ${workflowLabel}`;
  }
}

export function setDrawerReviewVisible(isVisible) {
  const reviewTab = byId('drawer-tab-review');
  if (reviewTab) reviewTab.hidden = !isVisible;
}

export function resetDrawerReview(doc) {
  const confirmBtn = byId('btn-confirm-review');
  if (confirmBtn) confirmBtn.disabled = true;

  document.querySelectorAll('.rwf-btn').forEach(button => {
    button.classList.remove('active');
  });

  const reviewObs = byId('review-obs');
  const adminNotes = byId('review-admin-notes');
  const signerEmail = byId('review-sig-email');
  const signerWrap = byId('review-sig-wrap');

  if (reviewObs) reviewObs.value = doc.observacao_admin || '';
  if (adminNotes) adminNotes.value = doc.admin_notes || '';
  if (signerEmail) signerEmail.value = '';
  if (signerWrap) signerWrap.hidden = true;
}

export function renderDrawerViewer(doc, signedUrl) {
  const frame = byId('pdf-frame');
  const noPreview = byId('no-preview');
  const filename = byId('viewer-filename');

  if (filename) filename.textContent = doc.nome_arquivo || doc.label;
  if (!frame || !noPreview) return;

  if (!signedUrl) {
    frame.src = 'about:blank';
    frame.hidden = true;
    frame.style.display = 'none';
    noPreview.hidden = false;
    noPreview.style.display = 'block';
    return;
  }

  frame.hidden = false;
  frame.src = doc.mime_type?.startsWith('image/')
    ? signedUrl
    : `${signedUrl}#toolbar=1&navpanes=0&view=FitH`;
  noPreview.hidden = true;
  noPreview.style.display = 'none';
  frame.style.display = 'block';
}

export function setDrawerTab(tab) {
  document.querySelectorAll('.drawer-tab').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });
  document.querySelectorAll('.drawer-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.tabPanel === tab);
  });
}

export function setDrawerOpen(isOpen) {
  byId('doc-drawer')?.classList.toggle('open', Boolean(isOpen));
}

export function selectDrawerWorkflow(workflowStatus) {
  document.querySelectorAll('.rwf-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.ws === workflowStatus);
  });

  const confirmBtn = byId('btn-confirm-review');
  const signerWrap = byId('review-sig-wrap');
  if (confirmBtn) confirmBtn.disabled = false;
  if (signerWrap) signerWrap.hidden = workflowStatus !== 'aguardando_assinatura';
}

export function getDrawerReviewPayload() {
  return {
    obs: byId('review-obs')?.value.trim() || null,
    adminNotes: byId('review-admin-notes')?.value.trim() || null,
    sigEmail: byId('review-sig-email')?.value.trim() || null,
  };
}
