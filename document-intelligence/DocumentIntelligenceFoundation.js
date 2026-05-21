import { bus } from '../modules/events/EventBus.js';
import { buildDocumentMetadata, validateDocumentMetadata } from './metadata/MetadataEngine.js';
import { documentClassificationEngine } from './classification/DocumentClassificationEngine.js';
import { documentLifecycleEngine } from './versions/DocumentLifecycleEngine.js';
import { documentVersioningEngine } from './versions/DocumentVersioningEngine.js';
import { caseDocumentTimelineEngine } from './timelines/CaseDocumentTimelineEngine.js';
import { evidenceManagementEngine } from './evidence/EvidenceManagementEngine.js';
import { metadataIndexingFoundation } from './indexing/IndexingFoundation.js';
import { documentSearchEngine } from './search/DocumentSearchEngine.js';
import { knowledgeTelemetry } from './telemetry/KnowledgeTelemetry.js';
import { listKnowledgeDomains } from './knowledge/KnowledgeBaseFoundation.js';
import { listVideoTracks } from './knowledge/videos/VideoKnowledgeFoundation.js';
import { learningJourneyEngine } from './knowledge/journeys/LearningJourneyEngine.js';

let mounted = false;
let offs = [];

const _metadata = [];

function registerDocumentEvent(payload = {}, envelope = {}) {
  const metadata = buildDocumentMetadata({
    document_id: payload.document_id || payload.id || `doc_${Date.now()}`,
    type: payload.type || payload.tipo || 'contrato',
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    owner_id: envelope.actor_id || payload.owner_id || 'system',
    workflow_status: payload.workflow_status || 'uploaded',
    upload_source: payload.upload_source || 'portal',
    lifecycle_state: payload.lifecycle_state || 'uploaded',
    validation_state: payload.validation_state || 'pending',
    tags: payload.tags || [],
    retention_policy: payload.retention_policy || 'legal_default_5y',
    trace_id: envelope.trace_id || envelope.correlation_id || null,
    workflow_id: envelope.workflow_id || null,
  });

  const check = validateDocumentMetadata(metadata);
  if (!check.valid) return null;

  _metadata.unshift(metadata);
  if (_metadata.length > 5000) _metadata.length = 5000;

  documentClassificationEngine.classifyWorkflow({
    document_id: metadata.document_id,
    type: metadata.type,
    category: metadata.category,
    tenant_id: metadata.tenant_id,
    actor_id: metadata.owner_id,
    workflow_id: metadata.workflow_id,
  });

  documentLifecycleEngine.start(metadata.document_id, {
    tenant_id: metadata.tenant_id,
    actor_id: metadata.owner_id,
  });

  metadataIndexingFoundation.index(metadata);

  caseDocumentTimelineEngine.add({
    case_id: payload.case_id || null,
    document_id: metadata.document_id,
    event: 'document.uploaded',
    tenant_id: metadata.tenant_id,
    actor_id: metadata.owner_id,
    workflow_id: metadata.workflow_id,
    trace_id: metadata.trace_id,
    details: { type: metadata.type, category: metadata.category },
  });

  knowledgeTelemetry.track({
    event: 'knowledge.document.accessed',
    tenant_id: metadata.tenant_id,
    actor_id: metadata.owner_id,
    details: { document_id: metadata.document_id, type: metadata.type },
  });

  return metadata;
}

export function mountDocumentIntelligenceFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('document.created', registerDocumentEvent),
    bus.on('document.uploaded', registerDocumentEvent),
    bus.on('document.approved', (payload, envelope) => {
      const id = payload.document_id || payload.id;
      if (!id) return;
      try {
        documentLifecycleEngine.transition(id, 'pending_review', {
          tenant_id: envelope.tenant_id || 'hmadv',
          actor_id: envelope.actor_id || 'system',
          workflow_id: envelope.workflow_id || null,
          trace_id: envelope.trace_id || envelope.correlation_id || null,
        });
        documentLifecycleEngine.transition(id, 'approved', {
          tenant_id: envelope.tenant_id || 'hmadv',
          actor_id: envelope.actor_id || 'system',
          workflow_id: envelope.workflow_id || null,
          trace_id: envelope.trace_id || envelope.correlation_id || null,
        });
      } catch (_) {}
      documentVersioningEngine.addRevision({
        document_id: id,
        version: payload.version || 1,
        approval_history: [{ by: envelope.actor_id || 'system', status: 'approved', at: new Date().toISOString() }],
        tenant_id: envelope.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || 'system',
      });
      caseDocumentTimelineEngine.add({
        case_id: payload.case_id || null,
        document_id: id,
        event: 'document.approved',
        tenant_id: envelope.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || 'system',
        workflow_id: envelope.workflow_id || null,
      });
    }),
    bus.on('signature.completed', (payload, envelope) => {
      const id = payload.document_id || payload.id;
      if (!id) return;
      try {
        documentLifecycleEngine.transition(id, 'signed', {
          tenant_id: envelope.tenant_id || 'hmadv',
          actor_id: envelope.actor_id || 'system',
          workflow_id: envelope.workflow_id || null,
          trace_id: envelope.trace_id || envelope.correlation_id || null,
        });
      } catch (_) {}
      documentVersioningEngine.addRevision({
        document_id: id,
        version: payload.version || 1,
        signature_history: [{ status: 'signed', at: new Date().toISOString() }],
        tenant_id: envelope.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || 'system',
      });
      evidenceManagementEngine.register({
        case_id: payload.case_id || null,
        document_id: id,
        category: 'juridico',
        type: 'signed_document',
        tenant_id: envelope.tenant_id || 'hmadv',
        owner_id: envelope.actor_id || 'system',
        workflow_id: envelope.workflow_id || null,
      });
      caseDocumentTimelineEngine.add({
        case_id: payload.case_id || null,
        document_id: id,
        event: 'document.signed',
        tenant_id: envelope.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || 'system',
        workflow_id: envelope.workflow_id || null,
      });
    }),
    bus.on('knowledge.video.watched', (payload, envelope) => {
      knowledgeTelemetry.track({
        event: 'knowledge.video.watched',
        tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || payload.actor_id || 'system',
        completion_state: 'watched',
        progress: payload.progress || 100,
        details: payload,
      });
    }),
    bus.on('knowledge.onboarding.progress', (payload, envelope) => {
      learningJourneyEngine.track({
        tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || payload.actor_id || 'system',
        journey: payload.journey || 'onboarding_legal',
        legal_progress: payload.progress || 0,
        checkpoint: payload.checkpoint || null,
        completed: !!payload.completed,
      });
      knowledgeTelemetry.track({
        event: 'knowledge.onboarding.progress',
        tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
        actor_id: envelope.actor_id || payload.actor_id || 'system',
        completion_state: payload.completed ? 'completed' : 'in_progress',
        progress: payload.progress || 0,
        details: payload,
      });
    }),
  ];
}

export function unmountDocumentIntelligenceFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectDocumentIntelligenceSnapshot() {
  return {
    metadata: { total: _metadata.length, list: [..._metadata] },
    lifecycle: documentLifecycleEngine.snapshot(),
    classifications: { total: documentClassificationEngine.list().length, list: documentClassificationEngine.list() },
    versions: { total: documentVersioningEngine.list().length, list: documentVersioningEngine.list() },
    evidence: { total: evidenceManagementEngine.list().length, list: evidenceManagementEngine.list() },
    timeline: { total: caseDocumentTimelineEngine.list().length, list: caseDocumentTimelineEngine.list() },
    search_index: { total: metadataIndexingFoundation.list().length },
    knowledge: {
      domains: listKnowledgeDomains(),
      videos: {
        onboarding: listVideoTracks('onboarding').length,
        cnj: listVideoTracks('cnj').length,
      },
      journey: learningJourneyEngine.snapshot(),
      telemetry: knowledgeTelemetry.snapshot(),
    },
    search: {
      metadata_query_all: documentSearchEngine.metadataSearch({}, 'hmadv').length,
    },
    generated_at: new Date().toISOString(),
  };
}

export const documentIntelligenceFoundation = {
  mount: mountDocumentIntelligenceFoundation,
  unmount: unmountDocumentIntelligenceFoundation,
  snapshot: collectDocumentIntelligenceSnapshot,
};
