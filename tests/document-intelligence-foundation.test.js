import { describe, expect, it } from 'vitest';
import { buildDocumentMetadata, validateDocumentMetadata } from '../document-intelligence/metadata/MetadataEngine.js';
import { documentLifecycleEngine } from '../document-intelligence/versions/DocumentLifecycleEngine.js';
import { documentClassificationEngine } from '../document-intelligence/classification/DocumentClassificationEngine.js';
import { documentIntelligenceFoundation } from '../document-intelligence/DocumentIntelligenceFoundation.js';

describe('document intelligence foundation', () => {
  it('enforces metadata-first document payload', () => {
    const metadata = buildDocumentMetadata({
      document_id: 'doc-test-1',
      type: 'cpf',
      tenant_id: 'tenant-doc',
      owner_id: 'user-doc',
    });

    const check = validateDocumentMetadata(metadata);
    expect(check.valid).toBe(true);
    expect(metadata.category).toBe('identidade');
    expect(metadata.retention_policy).toBeTruthy();
  });

  it('supports lifecycle transitions and snapshot generation', () => {
    documentLifecycleEngine.start('doc-test-2', { tenant_id: 'tenant-doc' });
    documentLifecycleEngine.transition('doc-test-2', 'pending_review', { tenant_id: 'tenant-doc' });
    documentLifecycleEngine.transition('doc-test-2', 'approved', { tenant_id: 'tenant-doc' });

    documentClassificationEngine.classifyManual({
      document_id: 'doc-test-2',
      type: 'contrato',
      tenant_id: 'tenant-doc',
      actor_id: 'lawyer-1',
    });

    const snapshot = documentIntelligenceFoundation.snapshot();
    expect(snapshot.lifecycle.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.classifications.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.knowledge.domains.length).toBeGreaterThanOrEqual(5);
  });
});
