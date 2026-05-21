import { existsSync } from 'node:fs';

const required = [
  'platform-os/README.md',
  'platform-os/PlatformOSDomainModel.js',
  'platform-os/PlatformOSFoundation.js',
  'platform-os/ShellPlatformOSVisibility.js',
  'platform-os/runtime/PlatformRuntimeEngine.js',
  'platform-os/deployments/DeploymentFoundation.js',
  'platform-os/scaling/ScalabilityFoundation.js',
  'platform-os/performance/PerformanceEngineeringEngine.js',
  'platform-os/caching/TenantCachingFoundation.js',
  'platform-os/edge/EdgeRuntimeFoundation.js',
  'platform-os/queues/QueuePlatformEngine.js',
  'platform-os/workers/WorkerOrchestrationEngine.js',
  'platform-os/resilience/ResilienceEngineeringEngine.js',
  'platform-os/failover/FailoverFoundation.js',
  'platform-os/backup/BackupFoundation.js',
  'platform-os/recovery/DisasterRecoveryFoundation.js',
  'platform-os/storage/StorageGovernanceEngine.js',
  'platform-os/network/NetworkFoundation.js',
  'platform-os/cdn/CdnFoundation.js',
  'platform-os/security/PlatformSecurityFoundation.js',
  'platform-os/monitoring/OperationalMonitoringEngine.js',
  'platform-os/telemetry/PlatformTelemetry.js',
  'platform-os/feature-flags/FeatureFlagPlatform.js',
  'platform-os/environments/EnvironmentGovernanceEngine.js',
  'platform-os/tenants/TenantIsolationPlatform.js',
  'platform-os/governance/PlatformGovernanceEngine.js',
  'platform-os/analytics/PlatformAnalyticsEngine.js',
  'platform-os/docs/platform-os-foundation.md',
  'platform-os/governance/platform-os-governance.md',
  'shared/contracts/platform-os/PlatformOSContracts.js',
  'shared/contracts/platform-os/DeploymentContracts.js',
  'shared/contracts/platform-os/QueueContracts.js',
  'shared/contracts/platform-os/RuntimeContracts.js',
  'shared/contracts/platform-os/ScalingContracts.js',
  'shared/contracts/platform-os/TelemetryContracts.js',
  'docs/platform-os/README.md',
  'docs/platform-os/runtime.md',
  'docs/platform-os/deployments.md',
  'docs/platform-os/queues.md',
  'docs/platform-os/workers.md',
  'docs/platform-os/scaling.md',
  'docs/platform-os/resilience.md',
  'docs/platform-os/observability.md',
  'docs/platform-os/environments.md',
  'governance/platform/deployment-standards.md',
  'governance/platform/runtime-standards.md',
  'governance/platform/queue-standards.md',
  'governance/platform/resilience-standards.md',
  'governance/platform/scaling-standards.md',
  'governance/platform/rollback-standards.md',
  'governance/platform/ai-platform-governance.md',
  'governance/platform/module-requirements.md',
  'pages/platform-os.html',
  'admin/platform-os/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:platform-os failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:platform-os passed');
