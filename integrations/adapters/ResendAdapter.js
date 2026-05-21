import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { resendIntegrationEngine } from '../providers/resend/ResendIntegrationEngine.js';
import { runConnector } from '../connectors/IntegrationConnectorGateway.js';

export class ResendAdapter {
  async sendInviteEmail(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_invite_email', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendInviteEmail(payload) }, validation.payload);
  }

  async sendTokenEmail(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_token_email', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendTokenEmail(payload) }, validation.payload);
  }

  async sendOnboardingReminder(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_onboarding_reminder', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendOnboardingReminder(payload) }, validation.payload);
  }

  async sendWorkflowReminder(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_workflow_reminder', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendWorkflowReminder(payload) }, validation.payload);
  }

  async sendSlaAlert(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_sla_alert', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendSlaAlert(payload) }, validation.payload);
  }

  async sendNotificationEmail(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_notification_email', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => resendIntegrationEngine.sendNotificationEmail(payload) }, validation.payload);
  }
}

export const resendAdapter = new ResendAdapter();
