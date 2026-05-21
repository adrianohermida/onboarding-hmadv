import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { freshdeskIntegrationEngine } from '../providers/freshdesk/FreshdeskIntegrationEngine.js';

export class FreshdeskAdapter {
  async createTicket(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'create_ticket', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return freshdeskIntegrationEngine.createTicket(payload);
  }

  async updatePipeline(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'update_pipeline', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return freshdeskIntegrationEngine.updatePipeline(payload);
  }

  async addPublicNote(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'freshdesk', operation: 'add_public_note', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return freshdeskIntegrationEngine.addPublicNote(payload);
  }
}

export const freshdeskAdapter = new FreshdeskAdapter();
