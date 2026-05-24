/**
 * Handler de rotas do Freshchat.
 * Porta as Pages Functions: freshchat-jwt, freshchat-widget-event.
 */

import type { Env } from '../env.d';
import { jsonError, methodNotAllowed } from '../lib/response';

function migrationPending(pathname: string): Response {
  return jsonError(`Rota temporariamente indisponível durante a migração para o Worker: ${pathname}`, 501);
}

export async function handleFreshchat(
  request: Request,
  _env: Env,
  pathname: string
): Promise<Response> {
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });

  if (pathname === '/api/freshchat-jwt') {
    if (method !== 'POST') return methodNotAllowed(method);
    return migrationPending(pathname);
  }

  if (pathname === '/api/freshchat-widget-event') {
    if (method !== 'POST') return methodNotAllowed(method);
    return migrationPending(pathname);
  }

  return jsonError(`Rota Freshchat não encontrada: ${pathname}`, 404);
}
