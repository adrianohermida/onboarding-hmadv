import { validateWebhookPayload } from '../../shared/contracts/integrations/WebhookContracts.js';
import { integrationQueue } from '../queues/IntegrationQueue.js';
import { integrationRetryEngine } from '../retries/IntegrationRetryEngine.js';
import { integrationLogger } from '../logs/IntegrationLogger.js';
import { integrationTelemetry } from '../telemetry/IntegrationTelemetry.js';
import { validateWebhookSecurity } from '../security/WebhookSecurity.js';

const DEAD_LETTER_MAX = 300;
const deadLetter = [];

export async function processWebhook(payload, handler, security = null) {
  const validation = validateWebhookPayload(payload);
  if (!validation.valid) {
    deadLetter.unshift({ payload, errors: validation.errors, reason: 'contract_invalid', timestamp: new Date().toISOString() });
    if (deadLetter.length > DEAD_LETTER_MAX) deadLetter.length = DEAD_LETTER_MAX;
    integrationLogger.log('webhook.invalid', { provider: payload?.provider, tenant_id: payload?.tenant_id, failure: validation.errors.join(', ') });
    return { ok: false, errors: validation.errors };
  }

  const normalized = validation.payload;
  if (security) {
    const secure = validateWebhookSecurity({
      provider: normalized.provider,
      tenant_id: normalized.tenant_id,
      signature: normalized.signature,
      expectedSignature: security.expectedSignature,
      timestamp: security.timestamp,
    });
    if (!secure.valid) {
      deadLetter.unshift({ payload: normalized, reason: secure.reason, timestamp: new Date().toISOString() });
      if (deadLetter.length > DEAD_LETTER_MAX) deadLetter.length = DEAD_LETTER_MAX;
      integrationLogger.log('webhook.security_failed', {
        provider: normalized.provider,
        operation: normalized.event,
        tenant_id: normalized.tenant_id,
        failure: secure.reason,
      });
      return { ok: false, error: secure.reason };
    }
  }

  integrationQueue.enqueue('webhook', normalized);
  const started = Date.now();

  try {
    const result = await integrationRetryEngine.run(() => handler(normalized), {
      provider: normalized.provider,
      operation: `webhook.${normalized.event}`,
      tenant_id: normalized.tenant_id,
      trace_id: normalized.correlation_id,
    });

    integrationTelemetry.record({
      provider: normalized.provider,
      operation: `webhook.${normalized.event}`,
      latency_ms: Date.now() - started,
      throughput: 1,
      tenant_id: normalized.tenant_id,
      trace_id: normalized.correlation_id,
    });

    integrationLogger.log('webhook.processed', {
      provider: normalized.provider,
      operation: normalized.event,
      tenant_id: normalized.tenant_id,
      request: normalized,
      response: result,
    });

    return { ok: true, result };
  } catch (error) {
    deadLetter.unshift({ payload: normalized, error: String(error), reason: 'handler_failed', timestamp: new Date().toISOString() });
    if (deadLetter.length > DEAD_LETTER_MAX) deadLetter.length = DEAD_LETTER_MAX;

    integrationTelemetry.record({
      provider: normalized.provider,
      operation: `webhook.${normalized.event}`,
      latency_ms: Date.now() - started,
      throughput: 1,
      failures: 1,
      tenant_id: normalized.tenant_id,
      trace_id: normalized.correlation_id,
    });

    integrationLogger.log('webhook.failed', {
      provider: normalized.provider,
      operation: normalized.event,
      tenant_id: normalized.tenant_id,
      failure: String(error),
      request: normalized,
    });

    return { ok: false, error: String(error) };
  }
}

export function listWebhookDeadLetter() {
  return [...deadLetter];
}
