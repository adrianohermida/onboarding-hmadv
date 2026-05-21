const BLOCKED_PATTERNS = [
  'aprovar automaticamente',
  'homologar automaticamente',
  'ignorar revisao humana',
  'bypass tenancy',
];

export class PromptGovernanceEngine {
  validate(prompt = '') {
    const normalized = String(prompt || '').toLowerCase();
    const violations = BLOCKED_PATTERNS.filter((pattern) => normalized.includes(pattern));
    return {
      valid: violations.length === 0,
      violations,
      governance_hooks: ['human_review', 'tenant_guard', 'audit_trail'],
    };
  }
}

export const promptGovernanceEngine = new PromptGovernanceEngine();
