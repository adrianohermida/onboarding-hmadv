export class DocumentPreviewEngine {
  buildPreview(payload = {}) {
    return {
      document_id: payload.document_id || null,
      tenant_id: payload.tenant_id || 'hmadv',
      preview_type: payload.preview_type || 'pdf',
      mobile: !!payload.mobile,
      signed: !!payload.signed,
      status: 'ready',
      generated_at: new Date().toISOString(),
    };
  }
}

export const documentPreviewEngine = new DocumentPreviewEngine();
