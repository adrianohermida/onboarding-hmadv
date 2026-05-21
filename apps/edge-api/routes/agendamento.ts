/**
 * Handler de rotas de agendamento público.
 * Porta as Pages Functions: slots, slots2, slots-month, agendar, confirmar, cancelar, remarcar.
 */

import type { Env } from '../env.d';
import { jsonError, methodNotAllowed } from '../lib/response';

function makeContext(request: Request, env: Env) {
  return { request, env, params: {}, next: async () => new Response('not found', { status: 404 }) };
}

const GET_ROUTES: Record<string, string> = {
  '/api/slots':       '../../../functions/api/slots.js',
  '/api/slots2':      '../../../functions/api/slots2.js',
  '/api/slots-month': '../../../functions/api/slots-month.js',
};

const POST_ROUTES: Record<string, string> = {
  '/api/agendar':   '../../../functions/api/agendar.js',
  '/api/confirmar': '../../../functions/api/confirmar.js',
  '/api/cancelar':  '../../../functions/api/cancelar.js',
  '/api/remarcar':  '../../../functions/api/remarcar.js',
};

export async function handleAgendamento(
  request: Request,
  env: Env,
  pathname: string
): Promise<Response> {
  const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });

  const ctx = makeContext(request, env);

  if (GET_ROUTES[pathname]) {
    if (method !== 'GET') return methodNotAllowed(method);
    try {
      const { onRequestGet } = await import(GET_ROUTES[pathname]);
      return onRequestGet(ctx);
    } catch (err: any) {
      return jsonError(err?.message || `Erro na rota ${pathname}.`, 500);
    }
  }

  if (POST_ROUTES[pathname]) {
    if (method !== 'POST') return methodNotAllowed(method);
    try {
      const { onRequestPost } = await import(POST_ROUTES[pathname]);
      return onRequestPost(ctx);
    } catch (err: any) {
      return jsonError(err?.message || `Erro na rota ${pathname}.`, 500);
    }
  }

  return jsonError(`Rota de agendamento não encontrada: ${pathname}`, 404);
}
