class WalletFoundation {
  snapshot(payload = {}) {
    return {
      enabled: false,
      future_ready: true,
      balance_cents: Number(payload.balance_cents) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const walletFoundation = new WalletFoundation();
