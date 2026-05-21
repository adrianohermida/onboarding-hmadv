import { existsSync } from 'node:fs';

const required = [
  'client-experience/README.md',
  'client-experience/ClientExperienceDomainModel.js',
  'client-experience/ClientExperienceFoundation.js',
  'client-experience/ShellClientExperienceVisibility.js',
  'client-experience/journeys/HumanizedJourneyEngine.js',
  'client-experience/engagement/EngagementEngine.js',
  'client-experience/communications/CommunicationOrchestration.js',
  'client-experience/notifications/SmartNotificationEngine.js',
  'client-experience/emotional-ux/EmotionalUxFoundation.js',
  'client-experience/education/EducationEngine.js',
  'client-experience/success/ClientSuccessEngine.js',
  'client-experience/feedback/ClientFeedbackEngine.js',
  'client-experience/satisfaction/SatisfactionEngine.js',
  'client-experience/retention/RetentionEngine.js',
  'client-experience/vulnerability/VulnerabilityEngine.js',
  'client-experience/guidance/GuidanceEngine.js',
  'client-experience/assistants/ClientAssistantFoundation.js',
  'client-experience/personalization/PersonalizationEngine.js',
  'client-experience/gamification/GamificationFoundation.js',
  'client-experience/progress/LearningProgressEngine.js',
  'client-experience/telemetry/ClientExperienceTelemetry.js',
  'client-experience/analytics/ClientExperienceAnalytics.js',
  'client-experience/governance/ClientExperienceGovernanceEngine.js',
  'client-experience/docs/client-experience-foundation.md',
  'client-experience/governance/client-experience-governance.md',
  'shared/contracts/client-experience/ClientExperienceContracts.js',
  'docs/client-experience/README.md',
  'docs/client-experience/journeys.md',
  'docs/client-experience/emotional-ux.md',
  'docs/client-experience/onboarding.md',
  'docs/client-experience/accessibility.md',
  'docs/client-experience/vulnerability.md',
  'docs/client-experience/engagement.md',
  'docs/client-experience/feedback.md',
  'governance/client-experience/communication-standards.md',
  'governance/client-experience/emotional-ux-standards.md',
  'governance/client-experience/onboarding-ux-standards.md',
  'governance/client-experience/notification-standards.md',
  'governance/client-experience/accessibility-standards.md',
  'governance/client-experience/ai-experience-governance.md',
  'governance/client-experience/module-requirements.md',
  'pages/experiencia-cliente.html',
  'admin/client-experience/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:client-experience failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:client-experience passed');
