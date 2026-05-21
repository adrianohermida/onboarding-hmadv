import { describe, expect, it } from 'vitest';
import { humanizedJourneyEngine } from '../client-experience/journeys/HumanizedJourneyEngine.js';
import { learningProgressEngine } from '../client-experience/progress/LearningProgressEngine.js';
import { clientFeedbackEngine } from '../client-experience/feedback/ClientFeedbackEngine.js';
import { retentionEngine } from '../client-experience/retention/RetentionEngine.js';
import { clientExperienceFoundation } from '../client-experience/ClientExperienceFoundation.js';

describe('client experience foundation', () => {
  it('tracks humanized journey and progress', () => {
    humanizedJourneyEngine.register({
      tenant_id: 'tenant-cx',
      client_id: 'client-1',
      stage: 'onboarding',
      status: 'active',
    });

    learningProgressEngine.track({
      tenant_id: 'tenant-cx',
      client_id: 'client-1',
      type: 'video_watched',
      completed: true,
      checkpoint: 'educacao_financeira',
    });

    retentionEngine.evaluate({ tenant_id: 'tenant-cx', client_id: 'client-1', inactivity_days: 15, onboarding_stalled: true });

    const snapshot = clientExperienceFoundation.snapshot('tenant-cx');
    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.progress.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.retention.high_risk).toBeGreaterThanOrEqual(1);
  });

  it('calculates satisfaction and feedback metrics', () => {
    clientFeedbackEngine.collect({ tenant_id: 'tenant-cx', client_id: 'client-1', area: 'onboarding', score: 8 });
    const snapshot = clientExperienceFoundation.snapshot('tenant-cx');
    expect(snapshot.feedback.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.satisfaction.satisfaction_index).toBeGreaterThanOrEqual(0);
  });
});
