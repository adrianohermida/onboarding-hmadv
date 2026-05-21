const CONSENT_TYPES = Object.freeze([
  'lgpd_general',
  'biometric_capture',
  'electronic_signature',
  'communications',
  'financial_analysis',
  'document_storage',
]);

export function isValidConsentType(value) {
  return CONSENT_TYPES.includes(value);
}

export function getConsentTypes() {
  return [...CONSENT_TYPES];
}
