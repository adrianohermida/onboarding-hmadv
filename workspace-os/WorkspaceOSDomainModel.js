const WORKSPACE_OS_DOMAIN_ENTITIES = [
  'WorkspaceCommandRecord',
  'WorkspaceSearchIndex',
  'WorkspaceContextSnapshot',
  'WorkspaceCopilotSnapshot',
  'WorkspaceActivityRecord',
  'WorkspacePanelState',
  'WorkspaceRuntimeState',
  'WorkspaceNavigationState',
  'WorkspaceActionSuggestion',
  'WorkspaceShortcutRecord',
  'WorkspaceNotificationRecord',
  'WorkspaceDockState',
  'WorkspaceMobileRuntime',
  'WorkspaceAnalyticsSnapshot',
  'WorkspaceTelemetrySnapshot',
  'WorkspaceGovernanceSnapshot',
];

export function listWorkspaceOsDomainEntities() {
  return [...WORKSPACE_OS_DOMAIN_ENTITIES];
}

export default WORKSPACE_OS_DOMAIN_ENTITIES;
