const CLIENT_EXPERIENCE_DOMAIN_ENTITIES = [
  'HumanizedJourney',
  'EngagementSignal',
  'CommunicationEvent',
  'SmartNotification',
  'EmotionalUxMessage',
  'EducationJourney',
  'ClientSuccessSignal',
  'ClientFeedback',
  'SatisfactionSignal',
  'RetentionRisk',
  'VulnerabilitySignal',
  'GuidanceStep',
  'AssistantHint',
  'PersonalizationProfile',
  'ProgressCheckpoint',
  'GamificationMilestone',
  'ClientExperienceTelemetry',
  'ClientExperienceAnalytics',
];

export function listClientExperienceDomainEntities() {
  return [...CLIENT_EXPERIENCE_DOMAIN_ENTITIES];
}

export default CLIENT_EXPERIENCE_DOMAIN_ENTITIES;
