import { describe, expect, it } from 'vitest';
import { normalizeAiPromptPayload } from '../shared/contracts/ai-os/PromptContracts.js';
import { normalizeAiRetrievalPayload } from '../shared/contracts/ai-os/RetrievalContracts.js';
import { normalizeAiWorkflowPayload } from '../shared/contracts/ai-os/WorkflowCopilotContracts.js';
import { normalizeAiCopilotPayload } from '../shared/contracts/ai-os/CopilotContracts.js';
import { normalizeAiReviewPayload } from '../shared/contracts/ai-os/ReviewContracts.js';

describe('ai os contracts', () => {
  it('normalizes prompt and retrieval payloads', () => {
    const prompt = normalizeAiPromptPayload({ tenant_id: 'tenant-ai', prompt: 'Explique onboarding' });
    const retrieval = normalizeAiRetrievalPayload({ source: 'knowledge', query: 'cnj' });

    expect(prompt.tenant_id).toBe('tenant-ai');
    expect(retrieval.source).toBe('knowledge');
  });

  it('normalizes workflow, copilot and review payloads', () => {
    const workflow = normalizeAiWorkflowPayload({ suggestions: ['revisar documentos'] });
    const copilot = normalizeAiCopilotPayload({ scope: 'workflow', text: 'Sugestao' });
    const review = normalizeAiReviewPayload({ approval_chain: ['advogado'] });

    expect(workflow.requires_human_review).toBe(true);
    expect(copilot.scope).toBe('workflow');
    expect(review.approval_chain.length).toBe(1);
  });
});
