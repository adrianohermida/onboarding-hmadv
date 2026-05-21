import { bus } from '../modules/events/EventBus.js';
import { humanizedJourneyEngine } from './journeys/HumanizedJourneyEngine.js';
import { engagementEngine } from './engagement/EngagementEngine.js';
import { communicationOrchestration } from './communications/CommunicationOrchestration.js';
import { smartNotificationEngine } from './notifications/SmartNotificationEngine.js';
import { emotionalUxFoundation } from './emotional-ux/EmotionalUxFoundation.js';
import { educationEngine } from './education/EducationEngine.js';
import { clientSuccessEngine } from './success/ClientSuccessEngine.js';
import { clientFeedbackEngine } from './feedback/ClientFeedbackEngine.js';
import { satisfactionEngine } from './satisfaction/SatisfactionEngine.js';
import { retentionEngine } from './retention/RetentionEngine.js';
import { vulnerabilityEngine } from './vulnerability/VulnerabilityEngine.js';
import { guidanceEngine } from './guidance/GuidanceEngine.js';
import { clientAssistantFoundation } from './assistants/ClientAssistantFoundation.js';
import { personalizationEngine } from './personalization/PersonalizationEngine.js';
import { gamificationFoundation } from './gamification/GamificationFoundation.js';
import { learningProgressEngine } from './progress/LearningProgressEngine.js';
import { clientExperienceTelemetry } from './telemetry/ClientExperienceTelemetry.js';
import { clientExperienceAnalytics } from './analytics/ClientExperienceAnalytics.js';
import { listClientExperienceDomainEntities } from './ClientExperienceDomainModel.js';

let mounted = false;
let offs = [];

function trace(event, payload = {}, envelope = {}) {
  const tenant_id = envelope.tenant_id || payload.tenant_id || 'hmadv';
  const actor_id = envelope.actor_id || payload.actor_id || 'system';

  clientExperienceTelemetry.track({
    event,
    tenant_id,
    client_id: payload.client_id || null,
    actor_id,
    onboarding_state: payload.onboarding_state || null,
    engagement_state: payload.engagement_state || null,
    vulnerability_state: payload.vulnerability_state || null,
    inputs: payload,
    outputs: {},
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountClientExperienceFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('client.journey.updated', (payload, envelope) => {
      humanizedJourneyEngine.register(payload);
      trace('client.journey.updated', payload, envelope);
    }),
    bus.on('onboarding.progressed', (payload, envelope) => {
      learningProgressEngine.track(payload);
      trace('onboarding.progressed', payload, envelope);
    }),
    bus.on('notification.sent', (payload, envelope) => {
      smartNotificationEngine.push(payload);
      trace('notification.sent', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      engagementEngine.track({ ...payload, type: 'upload' });
      trace('document.uploaded', payload, envelope);
    }),
    bus.on('knowledge.video.watched', (payload, envelope) => {
      educationEngine.register({ ...payload, type: 'video', completed: true });
      engagementEngine.track({ ...payload, type: 'video_watched' });
      trace('knowledge.video.watched', payload, envelope);
    }),
    bus.on('feedback.submitted', (payload, envelope) => {
      clientFeedbackEngine.collect(payload);
      trace('feedback.submitted', payload, envelope);
    }),
  ];
}

export function unmountClientExperienceFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectClientExperienceSnapshot(tenant_id = 'hmadv') {
  const journeys = humanizedJourneyEngine.list(tenant_id);
  const engagement = engagementEngine.list(tenant_id);
  const communications = communicationOrchestration.list(tenant_id);
  const notifications = smartNotificationEngine.list(tenant_id);
  const education = educationEngine.list(tenant_id);
  const feedback = clientFeedbackEngine.list(tenant_id);
  const retention = retentionEngine.list(tenant_id);
  const vulnerability = vulnerabilityEngine.list(tenant_id);
  const guidance = guidanceEngine.list(tenant_id);
  const personalization = personalizationEngine.list(tenant_id);
  const progress = learningProgressEngine.list(tenant_id);

  return {
    domain_entities: listClientExperienceDomainEntities(),
    journeys: { total: journeys.length, list: journeys },
    engagement: { total: engagement.length, list: engagement },
    communications: { total: communications.length, list: communications },
    notifications: { total: notifications.length, list: notifications },
    emotional_ux: emotionalUxFoundation.compose({}),
    education: { total: education.length, list: education },
    guidance: { total: guidance.length, list: guidance },
    assistants: clientAssistantFoundation.getAssistants(),
    personalization: { total: personalization.length, list: personalization },
    progress: { total: progress.length, completed: progress.filter((entry) => entry.completed).length, list: progress },
    gamification: gamificationFoundation.snapshot({ progress }),
    success: clientSuccessEngine.snapshot({ journeys, engagement, feedback, retention }),
    feedback: { total: feedback.length, list: feedback },
    satisfaction: satisfactionEngine.snapshot({ feedback, engagement, notifications }),
    retention: { total: retention.length, high_risk: retention.filter((entry) => entry.risk_level === 'high').length, list: retention },
    vulnerability: { total: vulnerability.length, high: vulnerability.filter((entry) => entry.severity === 'high').length, list: vulnerability },
    observability: {
      onboarding_abandonment: retention.filter((entry) => entry.onboarding_stalled).length,
      upload_friction: vulnerability.filter((entry) => entry.upload_difficulty).length,
      ux_bottlenecks: vulnerability.filter((entry) => entry.operational_anxiety_risk).length,
      client_delays: retention.filter((entry) => entry.inactivity_days > 7).length,
    },
    analytics: clientExperienceAnalytics.snapshot({ journeys, progress, engagement, feedback, retention, vulnerability }),
    telemetry: clientExperienceTelemetry.snapshot(tenant_id),
    generated_at: new Date().toISOString(),
  };
}

export const clientExperienceFoundation = {
  mount: mountClientExperienceFoundation,
  unmount: unmountClientExperienceFoundation,
  snapshot: collectClientExperienceSnapshot,
};
