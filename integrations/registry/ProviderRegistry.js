const PROVIDERS = [
  'freshdesk',
  'resend',
  'autentique',
  'supabase',
  'youtube_embeds',
  'ocr_provider_future',
  'whatsapp_provider_future',
  'stripe_future',
  'hubspot_future',
  'google_drive_future',
].map((name) => ({
  name,
  health_status: name.includes('_future') ? 'planned' : 'healthy',
  observability: true,
  tenant_awareness: true,
}));

export function listProviders() {
  return [...PROVIDERS];
}

export function getProvider(name) {
  const key = String(name || '').toLowerCase();
  return PROVIDERS.find((item) => item.name === key) || null;
}

export function providerHealthSnapshot() {
  const providers = listProviders();
  return {
    total: providers.length,
    healthy: providers.filter((item) => item.health_status === 'healthy').length,
    planned: providers.filter((item) => item.health_status === 'planned').length,
    degraded: providers.filter((item) => item.health_status === 'degraded').length,
    providers,
  };
}
