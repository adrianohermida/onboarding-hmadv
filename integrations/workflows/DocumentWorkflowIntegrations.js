import { autentiqueAdapter } from '../adapters/AutentiqueAdapter.js';
import { freshdeskAdapter } from '../adapters/FreshdeskAdapter.js';
import { resendAdapter } from '../adapters/ResendAdapter.js';

export async function runDocumentWorkflowIntegration(context = {}) {
  const request = {
    tenant_id: context.tenant_id || 'hmadv',
    workflow_id: context.workflow_id || `doc_wf_${Date.now()}`,
    trace_id: context.trace_id || null,
  };

  const signature = await autentiqueAdapter.createSignatureRequest({
    ...request,
    operation: 'create_signature_request',
    data: context.data || {},
  });

  await freshdeskAdapter.addPublicNote({
    ...request,
    operation: 'add_public_note',
    body: 'Fluxo documental iniciado com assinatura eletrônica.',
  });

  await resendAdapter.sendOnboardingReminder({
    ...request,
    operation: 'send_onboarding_reminder',
    to: context.email || null,
    name: context.name || 'Cliente',
  });

  return { ok: true, signature };
}
