import { describe, expect, it } from 'vitest';
import { copilotFoundation } from '../ai-os/copilot/CopilotFoundation.js';
import { retrievalFoundation } from '../ai-os/retrieval/RetrievalFoundation.js';
import { aiActionsFoundation } from '../ai-os/actions/AiActionsFoundation.js';
import { humanReviewFoundation } from '../ai-os/human-review/HumanReviewFoundation.js';
import { aiOsFoundation } from '../ai-os/AIOSFoundation.js';

describe('ai os foundation', () => {
  it('builds ai snapshot with governance and human review', () => {
    copilotFoundation.suggest({ tenant_id: 'tenant-ai', scope: 'onboarding' });
    retrievalFoundation.retrieve({ tenant_id: 'tenant-ai', source: 'onboarding', query: 'passos onboarding' });
    aiActionsFoundation.draft({ tenant_id: 'tenant-ai', type: 'checklist', content: 'Checklist de pendencias' });
    humanReviewFoundation.request({ tenant_id: 'tenant-ai', actor_id: 'law-1', ownership: 'legal_ops' });

    const snapshot = aiOsFoundation.snapshot('tenant-ai');
    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.retrieval.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.human_review.total).toBeGreaterThanOrEqual(1);
  });

  it('enforces no autonomous critical actions', () => {
    const snapshot = aiOsFoundation.snapshot('tenant-ai');
    expect(snapshot.governance.allow_autonomous_critical_actions).toBe(false);
    expect(snapshot.security.valid).toBe(true);
  });
});
