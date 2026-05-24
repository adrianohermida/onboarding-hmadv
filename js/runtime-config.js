(function initRuntimeSupabaseConfig() {
  function readStorageValue(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      var value = localStorage.getItem(key);
      return value && String(value).trim() ? String(value).trim() : null;
    } catch (_) {
      return null;
    }
  }

  var existing = (typeof window !== 'undefined' && window.__HM_SUPABASE__) || {};

  var runtimeConfig = {
    defaultUrl:
      existing.defaultUrl ||
      readStorageValue('SUPABASE_URL') ||
      readStorageValue('NEXT_PUBLIC_SUPABASE_URL') ||
      'https://sspvizogbcyigquqycsz.supabase.co',
    defaultKey:
      existing.defaultKey ||
      readStorageValue('SUPABASE_ANON_KEY') ||
      readStorageValue('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      '',
    messagingUrl:
      existing.messagingUrl ||
      readStorageValue('SUPABASE_URL_MESSAGING') ||
      'https://cundpbzqghmkohcozsex.supabase.co',
    messagingKey:
      existing.messagingKey ||
      readStorageValue('SUPABASE_ANON_KEY_MESSAGING') ||
      null,
  };

  if (typeof window !== 'undefined') {
    window.__HM_SUPABASE__ = runtimeConfig;
  }
})();
