export const WORKFLOW_DEFINITIONS = {
  onboarding: {
    name: 'onboarding',
    states: [
      'invite_sent',
      'account_activated',
      'consent_completed',
      'identity_completed',
      'uploads_completed',
      'onboarding_review',
      'onboarding_approved',
      'journey_enabled',
    ],
  },
  documents: {
    name: 'documents',
    states: [
      'document_uploaded',
      'pending_review',
      'approved',
      'rejected',
      'resubmission_required',
      'signed',
      'archived',
    ],
  },
  signatures: {
    name: 'signatures',
    states: ['signature_requested', 'pending', 'signed', 'rejected', 'expired'],
  },
  'financial-analysis': {
    name: 'financial-analysis',
    states: [
      'financial_data_received',
      'minimum_existential_analysis',
      'debt_analysis',
      'commitment_calculation',
      'eligibility_analysis',
      'plan_generation',
      'legal_review',
    ],
  },
  'debt-validation': {
    name: 'debt-validation',
    states: ['debt_received', 'debt_validating', 'debt_validated', 'debt_rejected'],
  },
  'payment-plan': {
    name: 'payment-plan',
    states: ['plan_requested', 'plan_generation', 'plan_review', 'plan_approved', 'plan_active'],
  },
  support: {
    name: 'support',
    states: ['support_requested', 'support_triage', 'support_in_progress', 'support_resolved'],
  },
  notifications: {
    name: 'notifications',
    states: ['notification_queued', 'notification_sent', 'notification_failed', 'notification_acknowledged'],
  },
  'freshdesk-orchestration': {
    name: 'freshdesk-orchestration',
    states: ['ticket_create', 'ticket_update', 'pipeline_move', 'ticket_synced'],
  },
};

export function getWorkflowDefinition(name) {
  return WORKFLOW_DEFINITIONS[name] || null;
}

export function listWorkflowDefinitions() {
  return Object.values(WORKFLOW_DEFINITIONS);
}
