import { validateIntegrationRequest } from '../../shared/contracts/integrations/RequestContracts.js';
import { autentiqueIntegrationEngine } from '../providers/autentique/AutentiqueIntegrationEngine.js';
import { runConnector } from '../connectors/IntegrationConnectorGateway.js';

export class AutentiqueAdapter {
  async createSignatureRequest(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'create_signature_request', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.createSignatureRequest(payload) }, validation.payload);
  }

  async uploadDocument(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'upload_document', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.uploadDocument(payload) }, validation.payload);
  }

  async signerWorkflow(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'signer_workflow', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.signerWorkflow(payload) }, validation.payload);
  }

  async signatureTracking(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'signature_tracking', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.signatureTracking(payload) }, validation.payload);
  }

  async webhookStatusSync(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'webhook_status_sync', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.webhookStatusSync(payload) }, validation.payload);
  }

  async retrieveSignedDocument(payload = {}) {
    const validation = validateIntegrationRequest({ provider: 'autentique', operation: 'retrieve_signed_document', ...payload });
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return runConnector({ run: () => autentiqueIntegrationEngine.retrieveSignedDocument(payload) }, validation.payload);
  }
}

export const autentiqueAdapter = new AutentiqueAdapter();
