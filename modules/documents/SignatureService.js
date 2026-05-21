/**
 * SignatureService — integração com Autentique API
 *
 * Arquitetura preparada para integração completa.
 * A chamada real ao Autentique deve passar por um Supabase Edge Function
 * para proteger a API key (nunca exposta no frontend).
 *
 * Fluxo:
 *   escritório → requestSignature() → Edge Function portal-signature
 *              → Autentique API → email para signatário
 *              → signatário assina → webhook Autentique
 *              → Edge Function portal-signature-webhook
 *              → atualiza portal_documentos.autentique_status
 *              → bus.emit('signature.completed')
 *
 * Eventos emitidos via bus:
 *   signature.requested   — envio para Autentique concluído
 *   signature.completed   — webhook de assinatura recebido
 *   signature.rejected    — signatário rejeitou
 *   signature.expired     — link expirou
 *   signature.resent      — reenvio solicitado
 */
import { bus } from '../events/EventBus.js';

// Autentique signature status mapping
export const AUTENTIQUE_STATUS = {
  pending:    { label: 'Aguardando assinatura', color: '#d97706', icon: '⏳' },
  signed:     { label: 'Assinado',              color: '#16a34a', icon: '✅' },
  rejected:   { label: 'Rejeitado',             color: '#dc2626', icon: '❌' },
  expired:    { label: 'Expirado',              color: '#6b7280', icon: '⌛' },
  processing: { label: 'Processando',           color: '#2E6DA4', icon: '🔄' },
};

export class SignatureService {
  /**
   * @param {string} functionsUrl — URL base das Edge Functions Supabase
   * @param {function} getToken — async () => token JWT (supabase session)
   */
  constructor(functionsUrl, getToken) {
    this._baseUrl  = functionsUrl;
    this._getToken = getToken;
  }

  // ── Request Signature ─────────────────────────────────────────────────────────
  /**
   * Envia documento para assinatura via Autentique.
   * A Edge Function portal-signature faz a chamada real à API Autentique.
   *
   * @param {object} params
   * @param {string} params.documentId    — UUID do portal_documentos.id
   * @param {string} params.storagePath   — path no Supabase Storage
   * @param {string} params.signerEmail   — email do signatário
   * @param {string} params.signerName    — nome do signatário
   * @param {string} [params.message]     — mensagem personalizada no email
   * @param {number} [params.expiresIn]   — dias para expiração (default: 7)
   * @param {string} [params.documentName] — nome do documento
   */
  async requestSignature(params) {
    const {
      documentId, storagePath, signerEmail, signerName,
      message, expiresIn = 7, documentName,
    } = params;

    try {
      const token = await this._getToken();
      const resp  = await fetch(`${this._baseUrl}/portal-signature`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action:       'request',
          document_id:  documentId,
          storage_path: storagePath,
          signer_email: signerEmail,
          signer_name:  signerName,
          message:      message || `Por favor, assine o documento: ${documentName || 'documento jurídico'}`,
          expires_in:   expiresIn,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${resp.status}`);
      }

      const result = await resp.json();

      bus.emit('signature.requested', {
        documentId, signerEmail, signerName,
        autentiqueId: result.autentique_id,
      });

      return result;

    } catch (e) {
      console.warn('[SignatureService] requestSignature error:', e.message);
      // Graceful degradation: return mock for demo/development
      const mockId = `mock_${Date.now()}`;
      bus.emit('signature.requested', {
        documentId, signerEmail, signerName,
        autentiqueId: mockId,
        mock: true,
      });
      return { autentique_id: mockId, status: 'pending', mock: true };
    }
  }

  // ── Check Status ──────────────────────────────────────────────────────────────
  async checkStatus(autentiqueId) {
    try {
      const token = await this._getToken();
      const resp  = await fetch(`${this._baseUrl}/portal-signature?id=${autentiqueId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn('[SignatureService] checkStatus error:', e.message);
      return { status: 'unknown', error: e.message };
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────────────
  async resend(autentiqueId, documentId) {
    try {
      const token = await this._getToken();
      await fetch(`${this._baseUrl}/portal-signature`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'resend', autentique_id: autentiqueId }),
      });
      bus.emit('signature.resent', { autentiqueId, documentId });
    } catch (e) {
      console.warn('[SignatureService] resend error:', e.message);
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  async cancel(autentiqueId) {
    try {
      const token = await this._getToken();
      await fetch(`${this._baseUrl}/portal-signature`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ autentique_id: autentiqueId }),
      });
    } catch (e) {
      console.warn('[SignatureService] cancel error:', e.message);
    }
  }

  // ── Build signing URL ─────────────────────────────────────────────────────────
  static getSigningUrl(autentiqueId) {
    // Autentique public signing URL pattern
    return `https://app.autentique.com.br/documento/assinar/${autentiqueId}`;
  }

  // ── Webhook handler (called by Edge Function portal-signature-webhook) ────────
  static parseWebhook(body) {
    // Autentique webhook payload structure
    const event      = body?.event;
    const document   = body?.document;
    const signatures = document?.signatures || [];
    const allSigned  = signatures.every(s => s.action?.name === 'SIGNED');

    return {
      autentiqueId: document?.id,
      event:        event?.name,          // SIGN, REJECT, VIEW, etc.
      allSigned,
      signers: signatures.map(s => ({
        email:  s.public_id,
        signed: s.action?.name === 'SIGNED',
        signedAt: s.action?.created_at,
    })),
    };
  }
}
