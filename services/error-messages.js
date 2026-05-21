export function toFriendlyMessage(error, fallback = 'Falha de conexao. Tente novamente em instantes.') {
  const msg = String(error?.message || '').toLowerCase();
  if (msg.includes('sess')) return 'Sessao expirada. Faca login novamente.';
  if (msg.includes('timeout')) return 'A requisicao demorou mais do que o esperado. Tente novamente.';
  return fallback;
}
