import { normalizeConsentPayload } from './ConsentContracts.js';
import { normalizeAuditPayload } from './AuditContracts.js';
import { normalizeRiskPayload } from './RiskContracts.js';
import { normalizeRetentionPayload } from './RetentionContracts.js';
import { normalizePrivacyPayload } from './PrivacyContracts.js';

export const complianceContracts = {
  normalizeConsentPayload,
  normalizeAuditPayload,
  normalizeRiskPayload,
  normalizeRetentionPayload,
  normalizePrivacyPayload,
};

export default complianceContracts;
