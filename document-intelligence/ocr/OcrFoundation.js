export const OCR_PROVIDERS_FUTURE = [
  'ocr_provider_future',
  'vision_provider_future',
  'face_match_future',
  'cnh_extraction_future',
];

export function buildOcrExtractionPipeline(payload = {}) {
  return {
    document_id: payload.document_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    provider: payload.provider || 'ocr_provider_future',
    mode: payload.mode || 'text_extraction',
    status: 'planned',
    created_at: new Date().toISOString(),
  };
}
