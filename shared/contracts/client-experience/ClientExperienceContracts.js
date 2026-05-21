import { normalizeClientNotificationPayload } from './NotificationContracts.js';
import { normalizeClientEngagementPayload } from './EngagementContracts.js';
import { normalizeClientOnboardingPayload } from './OnboardingExperienceContracts.js';
import { normalizeClientFeedbackPayload } from './FeedbackContracts.js';

export const clientExperienceContracts = {
  normalizeNotificationPayload: normalizeClientNotificationPayload,
  normalizeEngagementPayload: normalizeClientEngagementPayload,
  normalizeOnboardingPayload: normalizeClientOnboardingPayload,
  normalizeFeedbackPayload: normalizeClientFeedbackPayload,
};

export default clientExperienceContracts;
