import { existsSync } from 'node:fs';

const required = [
  'workspace-os/README.md',
  'workspace-os/WorkspaceOSDomainModel.js',
  'workspace-os/WorkspaceOSFoundation.js',
  'workspace-os/ShellWorkspaceOSVisibility.js',
  'workspace-os/command-center/CommandCenterEngine.js',
  'workspace-os/search/UniversalSearchEngine.js',
  'workspace-os/context/ContextEngine.js',
  'workspace-os/copilot/CopilotWorkspaceEngine.js',
  'workspace-os/activities/ActivityStreamEngine.js',
  'workspace-os/panels/MultiPanelWorkspaceEngine.js',
  'workspace-os/workspace/WorkspaceRuntimeEngine.js',
  'workspace-os/navigation/SmartNavigationEngine.js',
  'workspace-os/actions/ContextualActionsEngine.js',
  'workspace-os/shortcuts/KeyboardShortcutEngine.js',
  'workspace-os/assistant/WorkspaceAssistantEngine.js',
  'workspace-os/notifications/NotificationCenterV2Engine.js',
  'workspace-os/streams/GlobalActivityFeedEngine.js',
  'workspace-os/inspector/InspectorPanelEngine.js',
  'workspace-os/quick-actions/QuickActionsEngine.js',
  'workspace-os/dock/FloatingDockEngine.js',
  'workspace-os/mobile/MobileWorkspaceRuntime.js',
  'workspace-os/analytics/WorkspaceAnalyticsEngine.js',
  'workspace-os/telemetry/WorkspaceTelemetryEngine.js',
  'workspace-os/governance/WorkspaceGovernanceEngine.js',
  'workspace-os/docs/workspace-os-foundation.md',
  'workspace-os/governance/workspace-os-governance.md',
  'shared/contracts/workspace-os/WorkspaceOSContracts.js',
  'shared/contracts/workspace-os/CommandPayloadContracts.js',
  'shared/contracts/workspace-os/NavigationPayloadContracts.js',
  'shared/contracts/workspace-os/CopilotPayloadContracts.js',
  'shared/contracts/workspace-os/SearchPayloadContracts.js',
  'shared/contracts/workspace-os/ActivityPayloadContracts.js',
  'docs/workspace-os/README.md',
  'docs/workspace-os/command-center.md',
  'docs/workspace-os/copilots.md',
  'docs/workspace-os/tabs-and-panels.md',
  'docs/workspace-os/runtime.md',
  'docs/workspace-os/activity-streams.md',
  'docs/workspace-os/shortcuts.md',
  'governance/workspace-os/navigation-standards.md',
  'governance/workspace-os/copilot-standards.md',
  'governance/workspace-os/command-standards.md',
  'governance/workspace-os/shortcut-standards.md',
  'governance/workspace-os/workspace-standards.md',
  'governance/workspace-os/ai-workspace-governance.md',
  'governance/workspace-os/module-requirements.md',
  'pages/workspace-os.html',
  'admin/workspace-os/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:workspace-os failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:workspace-os passed');
