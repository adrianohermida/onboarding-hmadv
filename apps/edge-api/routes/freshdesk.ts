/**
 * Handler de rotas do Freshdesk.
 * Porta a Pages Function: freshdesk-ticket.
 */

import type { Env } from '../env.d';
import { jsonError, methodNotAllowed } from '../lib/response';

export async function handleFreshdesk(request: Request, env: Env): Promise<Response> {
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });
  if (method !== 'POST') return methodNotAllowed(method);

  if (!env.FRESHDESK_DOMAIN || !env.FRESHDESK_BASIC_TOKEN) {
    return jsonError('Freshdesk ainda não foi migrado para o hmadv-api.', 501);
  }

  return jsonError('Freshdesk ainda não foi migrado para o hmadv-api.', 501);
}
