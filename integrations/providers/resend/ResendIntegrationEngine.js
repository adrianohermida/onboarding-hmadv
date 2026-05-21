import { integrationTelemetry } from '../../telemetry/IntegrationTelemetry.js';
import { integrationLogger } from '../../logs/IntegrationLogger.js';
import { RESEND_TEMPLATES } from './templates/EmailTemplates.js';

export class ResendIntegrationEngine {
  async sendInviteEmail(input = {}) { return this._send('invite', input); }
  async sendTokenEmail(input = {}) { return this._send('notificacoes', input); }
  async sendOnboardingReminder(input = {}) { return this._send('onboarding', input); }
  async sendWorkflowReminder(input = {}) { return this._send('notificacoes', input); }
  async sendSlaAlert(input = {}) { return this._send('sla', input); }
  async sendNotificationEmail(input = {}) { return this._send('notificacoes', input); }

  async _send(template, input = {}) {
    const start = Date.now();
    const build = RESEND_TEMPLATES[template] || RESEND_TEMPLATES.notificacoes;
    const rendered = build({ name: input.name || 'Cliente' });

    const result = {
      ok: true,
      provider: 'resend',
      to: input.to || null,
      template,
      subject: rendered.subject,
      message_id: `msg_${Math.random().toString(36).slice(2, 10)}`,
    };

    integrationTelemetry.record({
      provider: 'resend',
      operation: `send_${template}`,
      latency_ms: Date.now() - start,
      throughput: 1,
      tenant_id: input.tenant_id || 'hmadv',
      trace_id: input.trace_id || null,
    });

    integrationLogger.log('provider.request', {
      provider: 'resend',
      operation: `send_${template}`,
      tenant_id: input.tenant_id || 'hmadv',
      workflow_id: input.workflow_id || null,
      request: input,
      response: result,
    });

    return result;
  }
}

export const resendIntegrationEngine = new ResendIntegrationEngine();
