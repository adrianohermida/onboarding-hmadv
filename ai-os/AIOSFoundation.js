import { bus } from '../modules/events/EventBus.js';
import { listAiAgents, executeAgent } from './agents/AgentRegistry.js';
import { copilotFoundation } from './copilot/CopilotFoundation.js';
import { contextEngine } from './context/ContextEngine.js';
import { memoryFoundation } from './memory/MemoryFoundation.js';
import { promptGovernanceEngine } from './prompts/PromptGovernanceEngine.js';
import { skillEngine } from './skills/SkillEngine.js';
import { aiWorkflowAssistance } from './workflows/AiWorkflowAssistance.js';
import { reasoningEngine } from './reasoning/ReasoningEngine.js';
import { retrievalFoundation } from './retrieval/RetrievalFoundation.js';
import { aiActionsFoundation } from './actions/AiActionsFoundation.js';
import { aiGovernanceEngine } from './governance/AiGovernanceEngine.js';
import { aiTelemetry } from './telemetry/AiTelemetry.js';
import { aiAnalytics } from './analytics/AiAnalytics.js';
import { aiSecurityGovernance } from './security/AiSecurityGovernance.js';
import { aiObservability } from './observability/AiObservability.js';
import { handoffEngine } from './handoff/HandoffEngine.js';
import { aiOrchestrationFoundation } from './orchestration/AiOrchestrationFoundation.js';
import { aiRuntimeGovernance } from './runtime/AiRuntimeGovernance.js';
import { humanReviewFoundation } from './human-review/HumanReviewFoundation.js';
import { listAiOsDomainEntities } from './AIOSDomainModel.js';

let mounted = false;
let offs = [];

function trace(event, payload = {}, envelope = {}) {
  aiTelemetry.track({
    event,
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    agent: payload.agent || payload.agent_key || 'copilot',
    latency_ms: Number(payload.latency_ms) || 0,
    status: payload.status || 'ok',
    retries: Number(payload.retries) || 0,
    escalation: payload.escalation === true,
    human_review: payload.human_review === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountAiOsFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('ai.prompt.executed', (payload, envelope) => {
      promptGovernanceEngine.validate(payload.prompt || '');
      trace('ai.prompt.executed', payload, envelope);
    }),
    bus.on('ai.retrieval.requested', (payload, envelope) => {
      retrievalFoundation.retrieve(payload);
      trace('ai.retrieval.requested', payload, envelope);
    }),
    bus.on('ai.action.drafted', (payload, envelope) => {
      aiActionsFoundation.draft(payload);
      humanReviewFoundation.request({ tenant_id: payload.tenant_id, actor_id: payload.actor_id, ownership: payload.ownership || 'ai_os', audit_trail: [payload] });
      trace('ai.action.drafted', { ...payload, human_review: true }, envelope);
    }),
    bus.on('ai.handoff.requested', (payload, envelope) => {
      handoffEngine.transfer(payload);
      aiOrchestrationFoundation.handoff(payload);
      trace('ai.handoff.requested', payload, envelope);
    }),
  ];
}

export function unmountAiOsFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectAiOsSnapshot(tenant_id = 'hmadv') {
  const telemetry = aiTelemetry.snapshot(tenant_id);
  const retrieval = retrievalFoundation.list(tenant_id);
  const actions = aiActionsFoundation.list(tenant_id);
  const reviews = humanReviewFoundation.list(tenant_id);

  return {
    domain_entities: listAiOsDomainEntities(),
    agents: listAiAgents(),
    copilot: { total: copilotFoundation.list(tenant_id).length, list: copilotFoundation.list(tenant_id) },
    context: contextEngine.compose({ tenant_id }),
    memory: memoryFoundation.snapshot(tenant_id),
    prompt_governance: promptGovernanceEngine.validate('safe prompt'),
    skills: skillEngine.list(),
    workflow_assistance: aiWorkflowAssistance.suggest({}),
    reasoning: reasoningEngine.explain({}),
    retrieval: { total: retrieval.length, list: retrieval },
    actions: { total: actions.length, list: actions },
    governance: aiGovernanceEngine.guard({ tenant_safe: true, lgpd_safe: true }),
    security: aiSecurityGovernance.validate({ tenant_aware: true, lgpd_aware: true, permission_aware: true }),
    runtime: aiRuntimeGovernance.evaluate({ tenant_id }),
    handoff: aiOrchestrationFoundation.handoff({}),
    human_review: { total: reviews.length, pending: reviews.filter((entry) => entry.status === 'pending').length, list: reviews },
    telemetry,
    observability: aiObservability.evaluate({ telemetry: telemetry.list, runtime: [aiRuntimeGovernance.evaluate({ tenant_id })] }),
    analytics: aiAnalytics.snapshot({
      telemetry,
      onboarding: { assistance: telemetry.total, abandonment_reduction_signal: Math.max(0, telemetry.total - telemetry.failures) },
      workflow: { productivity: actions.length, support_deflection: retrieval.length },
      financial: { engagement: retrieval.filter((entry) => String(entry.source).includes('financial')).length },
    }),
    execute: (agentKey, payload = {}) => executeAgent(agentKey, payload),
    generated_at: new Date().toISOString(),
  };
}

export const aiOsFoundation = {
  mount: mountAiOsFoundation,
  unmount: unmountAiOsFoundation,
  snapshot: collectAiOsSnapshot,
};
