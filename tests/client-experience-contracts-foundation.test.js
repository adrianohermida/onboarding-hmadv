import { describe, expect, it } from 'vitest';
import { normalizeClientNotificationPayload } from '../shared/contracts/client-experience/NotificationContracts.js';
import { normalizeClientEngagementPayload } from '../shared/contracts/client-experience/EngagementContracts.js';
import { normalizeClientOnboardingPayload } from '../shared/contracts/client-experience/OnboardingExperienceContracts.js';
import { normalizeClientFeedbackPayload } from '../shared/contracts/client-experience/FeedbackContracts.js';

describe('client experience contracts', () => {
  it('normalizes notification and engagement payloads', () => {
    const notification = normalizeClientNotificationPayload({ tenant_id: 'tenant-cx', category: 'onboarding' });
    const engagement = normalizeClientEngagementPayload({ tenant_id: 'tenant-cx', type: 'portal_access' });

    expect(notification.tenant_id).toBe('tenant-cx');
    expect(engagement.type).toBe('portal_access');
  });

  it('normalizes onboarding and feedback payloads', () => {
    const onboarding = normalizeClientOnboardingPayload({ stage: 'onboarding', progress_percent: 40 });
    const feedback = normalizeClientFeedbackPayload({ area: 'suporte', score: 9 });

    expect(onboarding.stage).toBe('onboarding');
    expect(feedback.score).toBe(9);
  });
});
