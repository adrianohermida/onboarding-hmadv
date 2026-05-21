const PLATFORM_OS_DOMAIN_ENTITIES = [
  'PlatformRuntime',
  'DeploymentRecord',
  'QueueRecord',
  'WorkerRecord',
  'ScalingRecord',
  'FeatureFlagRecord',
  'EnvironmentRecord',
  'TenantIsolationRecord',
  'ResilienceRecord',
  'FailoverRecord',
  'BackupRecord',
  'RecoveryRecord',
  'MonitoringSnapshot',
  'PlatformTelemetryRecord',
  'PlatformAnalyticsSnapshot',
];

export function listPlatformOsDomainEntities() {
  return [...PLATFORM_OS_DOMAIN_ENTITIES];
}

export default PLATFORM_OS_DOMAIN_ENTITIES;
