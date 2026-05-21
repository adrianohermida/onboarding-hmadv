import { bus } from '../../modules/events/EventBus.js';
import { workflowEngine } from '../workflows/WorkflowEngine.js';

workflowEngine.register({
  name: 'onboarding.lifecycle',
  steps: [
    { name: 'documents-submitted', run: async () => {} },
    { name: 'validation-completed', run: async () => {} },
    { name: 'office-approval', run: async () => {} },
    { name: 'journey-released', run: async () => {} },
  ],
});

export function mountOnboardingOrchestrator() {
  const offStarted = bus.on('onboarding.started', async (payload, envelope) => {
    await workflowEngine.run('onboarding.lifecycle', {
      actor_id: envelope?.actor_id,
      tenant_id: envelope?.tenant_id,
      onboarding: payload,
      workflow_id: envelope?.workflow_id,
    });
  });

  const offUploaded = bus.on('document.uploaded', (payload, envelope) => {
    bus.emit('onboarding.document.uploaded', {
      onboarding_id: payload?.onboarding_id || payload?.entity_id || null,
      document_id: payload?.docId || payload?.document_id || null,
    }, { correlation_id: envelope?.correlation_id, tenant_id: envelope?.tenant_id });
  });

  return () => {
    offStarted?.();
    offUploaded?.();
  };
}
