export function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCpf(value = '') {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

export function normalizePhone(value = '') {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

export function normalizeMoney(value) {
  return Math.round(toFiniteNumber(value, 0) * 100) / 100;
}

export function normalizeDateIso(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function normalizePercentage(value) {
  const pct = toFiniteNumber(value, 0);
  return Math.max(0, Math.min(100, pct));
}

export function normalizeDocumentType(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function normalizeUploadMetadata(input = {}) {
  return {
    file_name: String(input.file_name || input.fileName || '').trim(),
    mime_type: String(input.mime_type || input.mimeType || '').trim().toLowerCase(),
    size: toFiniteNumber(input.size, 0),
    uploaded_at: normalizeDateIso(input.uploaded_at || input.uploadedAt || new Date().toISOString()),
  };
}
