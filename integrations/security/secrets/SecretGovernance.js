const SECRET_MAP = {
  freshdesk: ['FRESHDESK_API_KEY', 'FRESHDESK_DOMAIN'],
  resend: ['RESEND_API_KEY', 'FROM_EMAIL', 'OFFICE_EMAIL'],
  autentique: ['AUTENTIQUE_API_KEY', 'AUTENTIQUE_WEBHOOK_SECRET'],
  supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  stripe_future: ['STRIPE_SECRET_KEY'],
  hubspot_future: ['HUBSPOT_TOKEN'],
  google_drive_future: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
};

export function requiredSecretsForProvider(provider) {
  return [...(SECRET_MAP[provider] || [])];
}

export function isSecretAllowed(provider, secretName) {
  return requiredSecretsForProvider(provider).includes(secretName);
}
