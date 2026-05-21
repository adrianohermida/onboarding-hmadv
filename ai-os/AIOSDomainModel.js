const AI_OS_DOMAIN_ENTITIES = [
  'AiAgent',
  'CopilotSuggestion',
  'ContextSnapshot',
  'MemorySession',
  'PromptExecution',
  'SkillExecution',
  'RetrievalResult',
  'AiActionDraft',
  'HumanReviewGate',
  'AiOrchestrationFlow',
  'AiRuntimePolicy',
  'AiTelemetryEvent',
  'AiObservabilitySignal',
  'AiSecurityPolicy',
  'AiAnalyticsSnapshot',
];

export function listAiOsDomainEntities() {
  return [...AI_OS_DOMAIN_ENTITIES];
}

export default AI_OS_DOMAIN_ENTITIES;
