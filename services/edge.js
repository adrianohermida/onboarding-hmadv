import { supabase } from './supabase.js';
import { FUNCTIONS_URL } from '../utils/config.js';
import { toFriendlyMessage } from './error-messages.js';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 350;
const TOKEN_REFRESH_SKEW_SECONDS = 90;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function emitServiceTelemetry(detail) {
  try {
    window.dispatchEvent(new CustomEvent('portal:service-error', { detail }));
  } catch (_) {}
}

function parseErrorPayload(payload, status) {
  if (!payload) return `HTTP ${status}`;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.error || `HTTP ${status}`;
}

function isSessionExpiring(session) {
  const expiresAt = Number(session?.expires_at || 0);
  if (!expiresAt) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return expiresAt - nowSeconds <= TOKEN_REFRESH_SKEW_SECONDS;
}

async function getFreshAccessToken(path) {
  const { data: { session }, error: sessErr } = await supabase.auth.getSession();
  if (sessErr || !session?.access_token) {
    const err = new Error('Sessao expirada');
    emitServiceTelemetry({ type: 'edge', path, stage: 'session', message: err.message });
    throw err;
  }

  if (!isSessionExpiring(session)) return session.access_token;

  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  const freshSession = refreshed?.session || session;

  // Transient refresh failure: log a warning but continue with the existing valid token
  // rather than hard-failing calls that could succeed with the current access_token.
  if (refreshErr) {
    emitServiceTelemetry({
      type: 'edge',
      path,
      stage: 'session-refresh-warn',
      message: refreshErr.message,
    });
  }

  if (!freshSession?.access_token) {
    const err = new Error('Sessao expirada');
    emitServiceTelemetry({ type: 'edge', path, stage: 'session-refresh', message: err.message });
    throw err;
  }

  return freshSession.access_token;
}

export { toFriendlyMessage };

export async function invokeEdgeFunction(path, {
  method = 'POST',
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
  backoffMs = DEFAULT_BACKOFF_MS,
  headers = {},
} = {}) {
  let accessToken = await getFreshAccessToken(path);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

    try {
      const response = await fetch(`${FUNCTIONS_URL}/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let payload = null;
        try { payload = await response.json(); } catch (_) { payload = await response.text().catch(() => null); }
        const message = parseErrorPayload(payload, response.status);
        const err = new Error(message);
        err.status = response.status;

        if (response.status === 401 && attempt < retries) {
          try {
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed?.session?.access_token && refreshed.session.access_token !== accessToken) {
              accessToken = refreshed.session.access_token;
              lastError = err;
              await delay(backoffMs * (attempt + 1));
              continue;
            }
          } catch (_) {}
        }

        // Retry only transient statuses
        if ((response.status === 408 || response.status === 429 || response.status >= 500) && attempt < retries) {
          lastError = err;
          await delay(backoffMs * (attempt + 1));
          continue;
        }

        emitServiceTelemetry({ type: 'edge', path, stage: 'response', status: response.status, message });
        throw err;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return await response.json();
      return await response.text();
    } catch (error) {
      clearTimeout(timer);
      const isAbort = error?.name === 'AbortError' || String(error).includes('timeout');
      const isNetwork = error instanceof TypeError;
      const retryable = isAbort || isNetwork;
      lastError = error;

      if (retryable && attempt < retries) {
        await delay(backoffMs * (attempt + 1));
        continue;
      }

      emitServiceTelemetry({
        type: 'edge',
        path,
        stage: 'request',
        message: String(error?.message || error || 'unknown'),
        retryable,
        attempt,
      });
      throw error;
    }
  }

  throw lastError || new Error('Falha na chamada da funcao Edge');
}
