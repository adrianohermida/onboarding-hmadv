import { assertConnectorAccessPolicy } from './ConnectorGovernance.js';
import { integrationRetryEngine } from '../retries/IntegrationRetryEngine.js';
import { integrationLogger } from '../logs/IntegrationLogger.js';

export async function runConnector(connector, context = {}) {
  assertConnectorAccessPolicy(context);

  const result = await integrationRetryEngine.run(
    (attempt) => connector.run({ ...context, attempt }),
    {
      provider: context.provider || 'connector',
      operation: context.operation || 'run',
      tenant_id: context.tenant_id || 'hmadv',
      workflow_id: context.workflow_id || null,
      trace_id: context.trace_id || null,
    },
  );

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
