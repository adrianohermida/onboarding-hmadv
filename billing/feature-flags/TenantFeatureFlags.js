import { isFeatureEnabled } from '../entitlements/EntitlementEngine.js';

export function getFeatureAvailability(entitlements = {}) {
  return { ...(entitlements?.features || {}) };
}

export function canAccessFeature(entitlements, featureKey) {
  return isFeatureEnabled(entitlements, featureKey);
}
