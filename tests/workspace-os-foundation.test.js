import { describe, expect, it } from 'vitest';
import { commandCenterEngine } from '../workspace-os/command-center/CommandCenterEngine.js';
import { workspaceTelemetryEngine } from '../workspace-os/telemetry/WorkspaceTelemetryEngine.js';
import { workspaceOsFoundation } from '../workspace-os/WorkspaceOSFoundation.js';

describe('workspace os foundation', () => {
  it('builds snapshot with command center, context and runtime', () => {
    commandCenterEngine.execute({ tenant_id: 'tenant-ws', key: 'client.open', category: 'navigation' });
    workspaceTelemetryEngine.track({ tenant_id: 'tenant-ws', category: 'navigation', name: 'workspace.switch', value: 1 });

    const snapshot = workspaceOsFoundation.snapshot('tenant-ws');

    expect(snapshot.domain_entities.length).toBeGreaterThan(8);
    expect(snapshot.command_center.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.workspace.open_tabs).toBeGreaterThanOrEqual(0);
    expect(snapshot.navigation.tab_persistence_ready).toBe(true);
  });

  it('enforces governance and AI safety boundaries', () => {
    const snapshot = workspaceOsFoundation.snapshot('tenant-ws');

    expect(snapshot.governance.command_standards).toBe(true);
    expect(snapshot.governance.critical_ai_actions_require_human_review).toBe(true);
    expect(snapshot.governance.tenancy_isolation_required).toBe(true);
  });
});
