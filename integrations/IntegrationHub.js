import { providerHealthEngine } from './health/ProviderHealthEngine.js';
import { integrationTelemetry } from './telemetry/IntegrationTelemetry.js';
import { integrationQueue } from './queues/IntegrationQueue.js';
import { listProviders } from './registry/ProviderRegistry.js';

let mounted = false;
let orchestratorModule = null;

export function mountIntegrationHub() {
  if (mounted) return;
  mounted = true;
  import('./orchestrators/IntegrationOrchestrators.js')
    .then((mod) => {
      orchestratorModule = mod;
      mod.mountIntegrationOrchestrators();
    })
    .catch(() => {
      mounted = false;
    });
}

export function unmountIntegrationHub() {
  if (orchestratorModule?.unmountIntegrationOrchestrators) {
    orchestratorModule.unmountIntegrationOrchestrators();
  }
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
