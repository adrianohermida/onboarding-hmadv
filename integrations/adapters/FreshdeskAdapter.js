import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { freshdeskIntegrationEngine } from '../providers/freshdesk/FreshdeskIntegrationEngine.js';
import { runConnector } from '../connectors/IntegrationConnectorGateway.js';

export class FreshdeskAdapter {
  async createTicket(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'create_ticket', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.createTicket(payload) }, validation.payload);
  }

  async updateTicket(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'update_ticket', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.updateTicket(payload) }, validation.payload);
  }

  async updatePipeline(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'update_pipeline', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.updatePipeline(payload) }, validation.payload);
  }

  async addPublicNote(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'add_public_note', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.addPublicNote(payload) }, validation.payload);
  }

  async addPrivateNote(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'add_private_note', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.addPrivateNote(payload) }, validation.payload);
  }

  async attachDocuments(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'attach_documents', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.attachDocuments(payload) }, validation.payload);
  }

  async assignAgent(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'assign_agent', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.assignAgent(payload) }, validation.payload);
  }

  async webhookSync(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'webhook_sync', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.webhookSync(payload) }, validation.payload);
  }

  async statusSync(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'status_sync', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => freshdeskIntegrationEngine.statusSync(payload) }, validation.payload);
  }
}

export const freshdeskAdapter = new FreshdeskAdapter();
