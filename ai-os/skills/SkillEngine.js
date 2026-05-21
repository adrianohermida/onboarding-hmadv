const SKILLS = [
  'summarize_documents',
  'explain_onboarding',
  'explain_superendividamento',
  'explain_cnj_process',
  'assist_uploads',
  'assist_workflows',
  'assist_financial_diagnosis',
  'assist_payment_plans',
  'assist_legal_operations',
];

export class SkillEngine {
  list() {
    return [...SKILLS];
  }

  execute(skill, payload = {}) {
    return {
      skill,
      available: SKILLS.includes(skill),
      payload,
      requires_human_review: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export const skillEngine = new SkillEngine();
