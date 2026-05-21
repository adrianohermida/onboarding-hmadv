import { describe, expect, it } from 'vitest';
import {
  normalizeCpf,
  normalizeMoney,
  normalizeDocumentType,
  normalizeUploadMetadata,
} from '../data-governance/normalizers/CommonNormalizers.js';
import { validateSchema } from '../data-governance/validation/SchemaValidator.js';
import { validateTenantAwarePayload } from '../data-governance/validation/TenantValidator.js';
import { toAnalyticsEventAdapter } from '../data-governance/transformers/DomainTransformers.js';

describe('data governance foundation', () => {
  it('normalizes canonical fields', () => {
    expect(normalizeCpf('123.456.789-00')).toBe('12345678900');
    expect(normalizeMoney('10.239')).toBe(10.24);
    expect(normalizeDocumentType('Comprovante de Renda')).toBe('comprovante_de_renda');

    const upload = normalizeUploadMetadata({
      fileName: 'arquivo.pdf',
      mimeType: 'APPLICATION/PDF',
      size: '12',
    });

    expect(upload.file_name).toBe('arquivo.pdf');
    expect(upload.mime_type).toBe('application/pdf');
    expect(upload.size).toBe(12);
  });

  it('validates schema and tenant awareness', () => {
    const schema = {
      required: ['tenant_id', 'name'],
      properties: {
        tenant_id: { type: 'string' },
        name: { type: 'string' },
      },
    };

    const ok = validateSchema({ tenant_id: 'hmadv', name: 'Client' }, schema);
    const bad = validateTenantAwarePayload({ name: 'Client' });

    expect(ok.valid).toBe(true);
    expect(bad.valid).toBe(false);
  });

  it('adapts analytics payloads to canonical contract shape', () => {
    const adapted = toAnalyticsEventAdapter({
      tenant_id: 'hmadv',
      metric: 'financial.score.changed',
      value: '8',
      metadata: { source: 'test' },
    });

    expect(adapted.tenant_id).toBe('hmadv');
    expect(adapted.metric).toBe('financial.score.changed');
    expect(adapted.value).toBe(8);
    expect(adapted.timestamp).toBeTruthy();
  });
});
