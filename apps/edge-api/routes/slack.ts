/**
 * Handler de rotas do Slack.
 * Porta a Pages Function: slack-events.
 */

import type { Env } from '../env.d';
import { jsonError, methodNotAllowed } from '../lib/response';

export async function handleSlack(request: Request, _env: Env): Promise<Response> {
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });
  if (method !== 'POST') return methodNotAllowed(method);

  return jsonError('Slack events ainda não foram migrados para o hmadv-api.', 501);
}
