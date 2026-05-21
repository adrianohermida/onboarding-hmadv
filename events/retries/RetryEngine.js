import { eventTelemetry } from '../telemetry/EventTelemetry.js';

export class RetryEngine {
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
        if (attempt > this._maxRetries) break;
        eventTelemetry.markRetried();
        const delayMs = this._baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const err = new Error(`retry limit reached for ${context.event || 'unknown-event'}`);
    err.cause = lastError;
    throw err;
  }
}

export const retryEngine = new RetryEngine();
