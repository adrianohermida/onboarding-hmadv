import { describe, expect, it } from 'vitest';
import { commandCenterFoundation } from '../ui-os/workspace/command-center/CommandCenterFoundation.js';
import { uiTelemetryEngine } from '../ui-os/telemetry/UiTelemetryEngine.js';
import { uiOsFoundation } from '../ui-os/UIOSFoundation.js';

describe('ui os foundation', () => {
  it('builds snapshot with tokens, layout and workspace command center', () => {
    commandCenterFoundation.register({ tenant_id: 'tenant-ui', key: 'open.search', category: 'navigation' });
    uiTelemetryEngine.track({ tenant_id: 'tenant-ui', category: 'interaction', name: 'ui.command.executed', value: 1 });

    const snapshot = uiOsFoundation.snapshot('tenant-ui');

    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.tokens).toBeTruthy();
    expect(snapshot.layouts.adaptive_layouts_ready).toBe(true);
    expect(snapshot.command_center.total).toBeGreaterThanOrEqual(1);
  });

  it('enforces governance and accessibility foundations', () => {
    const snapshot = uiOsFoundation.snapshot('tenant-ui');

    expect(snapshot.governance.tokens_required).toBe(true);
    expect(snapshot.governance.accessibility_required).toBe(true);
    expect(snapshot.accessibility.keyboard_navigation_ready).toBe(true);
  });
});
