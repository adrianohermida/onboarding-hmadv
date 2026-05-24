/**
 * Handler de rotas do Freshsales.
 * Porta as Pages Functions: freshsales-fields-catalog, admin-freshsales-*.
 */

import type { Env } from '../env.d';
import { jsonError, methodNotAllowed } from '../lib/response';

function migrationPending(pathname: string): Response {
  return jsonError(`Rota temporariamente indisponível durante a migração para o Worker: ${pathname}`, 501);
}

export async function handleFreshsales(
  request: Request,
  _env: Env,
  pathname: string
): Promise<Response> {
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });

  if (pathname === '/api/freshsales-fields-catalog') {
    if (method !== 'GET') return methodNotAllowed(method);
    return migrationPending(pathname);
  }

  if (pathname === '/api/admin-freshsales-catalog') {
    if (method !== 'GET') return methodNotAllowed(method);
    return migrationPending(pathname);
  }

  if (pathname === '/api/admin-freshsales-deal-fields') {
    if (method !== 'GET') return methodNotAllowed(method);
    return migrationPending(pathname);
  }

  return jsonError(`Rota Freshsales não encontrada: ${pathname}`, 404);
}
