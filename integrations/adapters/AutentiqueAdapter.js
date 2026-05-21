import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { autentiqueIntegrationEngine } from '../providers/autentique/AutentiqueIntegrationEngine.js';

export class AutentiqueAdapter {
  async createSignatureRequest(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'create_signature_request', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return autentiqueIntegrationEngine.createSignatureRequest(payload);
  }

  async signatureTracking(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'signature_tracking', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return autentiqueIntegrationEngine.signatureTracking(payload);
  }

  async retrieveSignedDocument(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'retrieve_signed_document', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return autentiqueIntegrationEngine.retrieveSignedDocument(payload);
  }
}

export const autentiqueAdapter = new AutentiqueAdapter();
