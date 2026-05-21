import { invokeEdgeFunction } from '../../services/edge.js';

export const DOCUMENT_NOTIFY_EVENT_MAP = {
  aprovado: 'document_approved',
  rejeitado: 'document_rejected',
  pendente_correcao: 'document_correction_requested',
  aguardando_assinatura: 'document_signature_requested',
  assinado: 'document_signed',
};

export async function applyDocumentReview({
  engine,
  signatureService,
  docId,
  workflowStatus,
  obs = null,
  adminNotes = null,
  sigEmail = null,
  documentName = null,
} = {}) {
  if (!engine || !docId || !workflowStatus) {
    throw new Error('Revisão documental incompleta.');
  }

  if (workflowStatus === 'aguardando_assinatura' && sigEmail) {
    if (!signatureService) {
      throw new Error('Serviço de assinatura não inicializado.');
    }

    const doc = engine.getAll().find(item => item.id === docId);
    await signatureService.requestSignature({
      documentId: docId,
      storagePath: doc?.storage_path,
      signerEmail: sigEmail,
      signerName: sigEmail,
      documentName: documentName || doc?.label,
    });
    await engine._adminWorkflow(docId, 'aguardando_assinatura', obs, adminNotes);
    return;
  }

  await engine._adminWorkflow(docId, workflowStatus, obs, adminNotes);
}

export async function notifyDocumentWorkflow({
  engine,
  docId,
  workflowStatus,
  obs = null,
  targetUserId = null,
} = {}) {
  const notifyType = DOCUMENT_NOTIFY_EVENT_MAP[workflowStatus];
  if (!notifyType || !engine || !docId) return;

  const doc = engine.getAll().find(item => item.id === docId);
  const tipo = doc?.tipo || docId;

  await invokeEdgeFunction('portal-notify', {
    method: 'POST',
    body: {
      type: notifyType,
      payload: {
        tipo,
        tipoLabel: doc?.label || tipo,
        status: workflowStatus,
        observacao: obs,
      },
      ...(targetUserId ? { targetUserId } : {}),
    },
    retries: 1,
    timeoutMs: 10000,
  });
}
