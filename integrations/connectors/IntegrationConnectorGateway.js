import { assertConnectorAccessPolicy } from './ConnectorGovernance.js';
import { integrationRetryEngine } from '../retries/IntegrationRetryEngine.js';
import { integrationLogger } from '../logs/IntegrationLogger.js';
import { integrationRateLimitPolicy } from '../security/rate-limits/RateLimitPolicy.js';
import { integrationTelemetry } from '../telemetry/IntegrationTelemetry.js';
import { normalizeIntegrationResponse } from '../../shared/contracts/integrations/ResponseContracts.js';

export async function runConnector(connector, context = {}) {
  assertConnectorAccessPolicy(context);
  const startedAt = Date.now();
  const rate = integrationRateLimitPolicy.check(context.provider || 'connector', context.tenant_id || 'hmadv');
  if (!rate.allowed) {
    integrationTelemetry.record({
      provider: context.provider || 'connector',
      operation: context.operation || 'run',
      latency_ms: Date.now() - startedAt,
      failures: 1,
      degraded: true,
      tenant_id: context.tenant_id || 'hmadv',
      trace_id: context.trace_id || null,
    });
    integrationLogger.log('connector.rate_limited', {
      provider: context.provider || 'connector',
      operation: context.operation || 'run',
      tenant_id: context.tenant_id || 'hmadv',
      workflow_id: context.workflow_id || null,
      request: context,
      failure: `rate_limit_exceeded:${rate.used}/${rate.limit}`,
    });
    throw new Error(`rate limit exceeded for ${context.provider || 'connector'} (${rate.used}/${rate.limit})`);
  }

  const rawResult = await integrationRetryEngine.run(
    (attempt) => connector.run({ ...context, attempt }),
    {
      provider: context.provider || 'connector',
      operation: context.operation || 'run',
      tenant_id: context.tenant_id || 'hmadv',
      workflow_id: context.workflow_id || null,
      trace_id: context.trace_id || null,
    },
  );

  const result = normalizeIntegrationResponse({
    ok: true,
    provider: context.provider || 'connector',
    operation: context.operation || 'run',
    tenant_id: context.tenant_id || 'hmadv',
    latency_ms: Date.now() - startedAt,
    data: rawResult,
  });

  integrationTelemetry.record({
    provider: context.provider || 'connector',
    operation: context.operation || 'run',
    latency_ms: result.latency_ms,
    throughput: 1,
    tenant_id: context.tenant_id || 'hmadv',
    trace_id: context.trace_id || null,
  });

  integrationLogger.log('connector.completed', {
    provider: context.provider || 'connector',
    operation: context.operation || 'run',
    tenant_id: context.tenant_id || 'hmadv',
    workflow_id: context.workflow_id || null,
    request: context,
    response: result,
  });

  return result;
}
