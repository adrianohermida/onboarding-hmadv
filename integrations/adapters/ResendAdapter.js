import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { resendIntegrationEngine } from '../providers/resend/ResendIntegrationEngine.js';

export class ResendAdapter {
  async sendInviteEmail(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_invite_email', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return resendIntegrationEngine.sendInviteEmail(payload);
  }

  async sendOnboardingReminder(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_onboarding_reminder', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return resendIntegrationEngine.sendOnboardingReminder(payload);
  }

  async sendSlaAlert(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'resend', operation: 'send_sla_alert', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return resendIntegrationEngine.sendSlaAlert(payload);
  }
}

export const resendAdapter = new ResendAdapter();
