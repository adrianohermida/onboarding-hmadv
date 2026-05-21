import { mountIntegrationOrchestrators, unmountIntegrationOrchestrators } from './orchestrators/IntegrationOrchestrators.js';
import { providerHealthEngine } from './health/ProviderHealthEngine.js';
import { integrationTelemetry } from './telemetry/IntegrationTelemetry.js';
import { integrationQueue } from './queues/IntegrationQueue.js';
import { listProviders } from './registry/ProviderRegistry.js';

let mounted = false;

export function mountIntegrationHub() {
  if (mounted) return;
  mounted = true;
  mountIntegrationOrchestrators();
}

export function unmountIntegrationHub() {
  unmountIntegrationOrchestrators();
  mounted = false;
}

export function collectIntegrationSnapshot() {
  return {
    providers: listProviders(),
    health: providerHealthEngine.snapshot(),
    telemetry: integrationTelemetry.snapshot(),
    queue_depth: integrationQueue.depth(),
    generated_at: new Date().toISOString(),
  };
}

export const integrationHub = {
  mount: mountIntegrationHub,
  unmount: unmountIntegrationHub,
  snapshot: collectIntegrationSnapshot,
};
