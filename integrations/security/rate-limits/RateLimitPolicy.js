const DEFAULT_LIMITS = {
  freshdesk: 60,
  resend: 120,
  autentique: 40,
  supabase: 300,
  ocr_provider_future: 30,
  whatsapp_provider_future: 30,
  stripe_future: 60,
  hubspot_future: 60,
  google_drive_future: 60,
};

export class RateLimitPolicy {
  constructor() {
    this._windows = new Map();
  }

  check(provider, tenant_id = 'hmadv') {
    const key = `${provider}:${tenant_id}`;
    const limit = DEFAULT_LIMITS[provider] || 30;
    const nowMinute = Math.floor(Date.now() / 60000);
    const current = this._windows.get(key) || { minute: nowMinute, count: 0 };

    if (current.minute !== nowMinute) {
      current.minute = nowMinute;
      current.count = 0;
    }

    current.count += 1;
    this._windows.set(key, current);

    return {
      allowed: current.count <= limit,
      limit,
      used: current.count,
      provider,
      tenant_id,
    };
  }
}

export const integrationRateLimitPolicy = new RateLimitPolicy();
