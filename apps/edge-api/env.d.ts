/**
 * Bindings e segredos disponíveis no Worker hmadv-api.
 *
 * Segredos declarados via `wrangler secret put` no Cloudflare Dashboard:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *   FRESHSALES_API_BASE, FRESHSALES_API_KEY,
 *   FRESHCHAT_APP_ID, FRESHCHAT_APP_KEY, FRESHCHAT_SECRET_KEY,
 *   FRESHDESK_DOMAIN, FRESHDESK_BASIC_TOKEN,
 *   SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN,
 *   HMADV_AI_SHARED_SECRET, HMDAV_AI_SHARED_SECRET
 */
export interface Env {
  // ── Supabase ────────────────────────────────────────────────────────────
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  /** Aliases usados em alguns contexts legados */
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;

  // ── Site ────────────────────────────────────────────────────────────────
  SITE_URL?: string;
  HM_ADMIN_OTP_EMAIL?: string;
  HM_ADMIN_OTP_CODE?: string;

  // ── Freshsales ──────────────────────────────────────────────────────────
  FRESHSALES_API_BASE?: string;
  FRESHSALES_API_KEY?: string;

  // ── Freshchat ───────────────────────────────────────────────────────────
  FRESHCHAT_APP_ID?: string;
  FRESHCHAT_APP_KEY?: string;
  FRESHCHAT_SECRET_KEY?: string;

  // ── Freshdesk ───────────────────────────────────────────────────────────
  FRESHDESK_DOMAIN?: string;
  FRESHDESK_BASIC_TOKEN?: string;

  // ── Slack ────────────────────────────────────────────────────────────────
  SLACK_SIGNING_SECRET?: string;
  SLACK_BOT_TOKEN?: string;

  // ── AI worker (inter-worker) ─────────────────────────────────────────────
  PROCESS_AI_BASE?: string;
  HMADV_AI_SHARED_SECRET?: string;
  /** Alias legado — preferir HMADV_AI_SHARED_SECRET */
  HMDAV_AI_SHARED_SECRET?: string;
}
