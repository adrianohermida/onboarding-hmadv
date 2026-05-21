import { integrationTelemetry } from '../telemetry/IntegrationTelemetry.js';
import { integrationLogger } from '../logs/IntegrationLogger.js';

export class IntegrationRetryEngine {
  constructor({ maxRetries = 3, baseDelayMs = 250 } = {}) {
    this._maxRetries = maxRetries;
    this._baseDelayMs = baseDelayMs;
  }

  async run(task, context = {}) {
    let attempt = 0;
    let lastError = null;

    while (attempt <= this._maxRetries) {
      try {
        return await task(attempt);
      } catch (error) {
        lastError = error;
        attempt += 1;
        integrationTelemetry.record({
          provider: context.provider,
          operation: context.operation,
          retries: 1,
          failures: 1,
          tenant_id: context.tenant_id,
          trace_id: context.trace_id,
        });
        integrationLogger.log('integration.retry', {
          provider: context.provider,
          operation: context.operation,
          tenant_id: context.tenant_id,
          workflow_id: context.workflow_id,
          retries: attempt,
          failure: String(error),
        });

        if (attempt > this._maxRetries) break;
        const delayMs = this._baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const err = new Error(`integration retry limit reached for ${context.provider || 'unknown'}.${context.operation || 'unknown'}`);
    err.cause = lastError;
    throw err;
  }
}

export const integrationRetryEngine = new IntegrationRetryEngine();
