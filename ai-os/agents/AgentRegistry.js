import { onboardingAgent } from './onboarding-agent/OnboardingAgent.js';
import { documentAgent } from './document-agent/DocumentAgent.js';
import { financialAgent } from './financial-agent/FinancialAgent.js';
import { superendividamentoAgent } from './superendividamento-agent/SuperendividamentoAgent.js';
import { cnjAgent } from './cnj-agent/CnjAgent.js';
import { workflowAgent } from './workflow-agent/WorkflowAgent.js';
import { supportAgent } from './support-agent/SupportAgent.js';
import { communicationAgent } from './communication-agent/CommunicationAgent.js';
import { legalOpsAgent } from './legal-ops-agent/LegalOpsAgent.js';
import { analyticsAgent } from './analytics-agent/AnalyticsAgent.js';

const AGENTS = [
  onboardingAgent,
  documentAgent,
  financialAgent,
  superendividamentoAgent,
  cnjAgent,
  workflowAgent,
  supportAgent,
  communicationAgent,
  legalOpsAgent,
  analyticsAgent,
];

export function listAiAgents() {
  return AGENTS.map((agent) => ({ key: agent.key }));
}

export function executeAgent(agentKey, payload = {}) {
  const agent = AGENTS.find((entry) => entry.key === agentKey);
  if (!agent) return { found: false, agentKey, payload };
  return { found: true, agentKey, result: agent.assist(payload) };
}
