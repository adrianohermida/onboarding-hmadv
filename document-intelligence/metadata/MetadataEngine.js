import { resolveDocumentCategory } from '../taxonomy/DocumentTaxonomy.js';

const REQUIRED_FIELDS = [
  'type',
  'category',
  'tenant_id',
  'owner_id',
  'workflow_status',
  'upload_source',
  'lifecycle_state',
  'validation_state',
  'tags',
  'timestamps',
  'retention_policy',
];

export function buildDocumentMetadata(payload = {}) {
  const type = String(payload.type || '').trim().toLowerCase();
  const category = payload.category || resolveDocumentCategory(type) || 'juridico';

  return {
    document_id: payload.document_id || `doc_${Date.now()}`,
    type,
    category,
    tenant_id: payload.tenant_id || 'hmadv',
    owner_id: payload.owner_id || 'system',
    workflow_status: payload.workflow_status || 'uploaded',
    upload_source: payload.upload_source || 'portal',
    lifecycle_state: payload.lifecycle_state || 'uploaded',
    validation_state: payload.validation_state || 'pending',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    timestamps: {
      uploaded_at: payload.uploaded_at || new Date().toISOString(),
      updated_at: payload.updated_at || new Date().toISOString(),
      reviewed_at: payload.reviewed_at || null,
    },
    retention_policy: payload.retention_policy || 'legal_default_5y',
    trace_id: payload.trace_id || null,
    workflow_id: payload.workflow_id || null,
  };
}

export function validateDocumentMetadata(metadata = {}) {
  const errors = [];
  REQUIRED_FIELDS.forEach((field) => {
    if (metadata[field] === undefined || metadata[field] === null) errors.push(`${field} is required`);
  });
  if (!metadata.type) errors.push('type is required');
  if (!metadata.category) errors.push('category is required');
  if (!metadata.tenant_id) errors.push('tenant_id is required');
  if (!metadata.owner_id) errors.push('owner_id is required');
  return { valid: errors.length === 0, errors };
}
