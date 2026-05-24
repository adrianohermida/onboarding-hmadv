/**
 * Entrypoint do Worker hmadv-api.
 *
 * Recebe todas as requisições HTTP e cron jobs, despacha para os handlers
 * em routes/index.ts.
 */

import type { Env } from './env.d';
import { handleRequest } from './routes/index';
import { handleCron } from './routes/cron';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron(event, env, ctx));
  },
} satisfies ExportedHandler<Env>;
