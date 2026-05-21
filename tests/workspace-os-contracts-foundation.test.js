import { describe, expect, it } from 'vitest';
import { normalizeWorkspaceCommandPayload } from '../shared/contracts/workspace-os/CommandPayloadContracts.js';
import { normalizeWorkspaceNavigationPayload } from '../shared/contracts/workspace-os/NavigationPayloadContracts.js';
import { normalizeWorkspaceCopilotPayload } from '../shared/contracts/workspace-os/CopilotPayloadContracts.js';
import { normalizeWorkspaceSearchPayload } from '../shared/contracts/workspace-os/SearchPayloadContracts.js';
import { normalizeWorkspaceActivityPayload } from '../shared/contracts/workspace-os/ActivityPayloadContracts.js';

describe('workspace os contracts', () => {
  it('normalizes command and navigation payloads', () => {
    const command = normalizeWorkspaceCommandPayload({ key: 'workflow.open', category: 'workflow' });
    const navigation = normalizeWorkspaceNavigationPayload({ key: 'clientes', href: '/pages/dashboard.html' });

    expect(command.key).toBe('workflow.open');
    expect(command.category).toBe('workflow');
    expect(navigation.key).toBe('clientes');
  });

  it('normalizes copilot, search and activity payloads', () => {
    const copilot = normalizeWorkspaceCopilotPayload({ context_type: 'workflow', next_steps: ['aprovar documento'] });
    const search = normalizeWorkspaceSearchPayload({ query: 'cliente ana', entity_type: 'cliente' });
    const activity = normalizeWorkspaceActivityPayload({ type: 'upload', title: 'Upload concluido' });

    expect(copilot.context_type).toBe('workflow');
    expect(search.entity_type).toBe('cliente');
    expect(activity.type).toBe('upload');
  });
});
