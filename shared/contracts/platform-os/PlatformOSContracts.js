import { normalizeDeploymentPayload } from './DeploymentContracts.js';
import { normalizeQueuePayload } from './QueueContracts.js';
import { normalizeRuntimePayload } from './RuntimeContracts.js';
import { normalizeScalingPayload } from './ScalingContracts.js';
import { normalizePlatformTelemetryPayload } from './TelemetryContracts.js';

export const platformOsContracts = {
  normalizeDeploymentPayload,
  normalizeQueuePayload,
  normalizeRuntimePayload,
  normalizeScalingPayload,
  normalizePlatformTelemetryPayload,
};

export default platformOsContracts;
