import { describe, expect, it } from 'vitest';
import { normalizeKnowledgeMetadata } from '../shared/contracts/knowledge/MetadataContracts.js';
import { normalizeKnowledgePayload } from '../shared/contracts/knowledge/KnowledgePayloadContracts.js';
import { normalizeTaxonomyPayload } from '../shared/contracts/knowledge/TaxonomyContracts.js';

describe('knowledge contracts foundation', () => {
  it('normalizes metadata payloads', () => {
    const payload = normalizeKnowledgeMetadata({ type: 'cpf', category: 'identidade', tenant_id: 'tenant-k' });
    expect(payload.type).toBe('cpf');
    expect(payload.tenant_id).toBe('tenant-k');
    expect(payload.retention_policy).toBeTruthy();
  });

  it('normalizes knowledge and taxonomy payloads', () => {
    const knowledge = normalizeKnowledgePayload({ domain: 'cnj', title: 'Cartilha CNJ' });
    const taxonomy = normalizeTaxonomyPayload({ type: 'anexo_ii', category: 'cnj' });

    expect(knowledge.domain).toBe('cnj');
    expect(taxonomy.category).toBe('cnj');
  });
});
