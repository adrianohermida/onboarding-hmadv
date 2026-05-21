import { bus } from '../modules/events/EventBus.js';
import { caseEngine } from './cases/CaseEngine.js';
import { clientOpsEngine } from './clients/ClientOpsEngine.js';
import { clientJourneyEngine } from './journeys/ClientJourneyEngine.js';
import { proceduralEngine } from './procedures/ProceduralEngine.js';
import { proceduralTimelineEngine } from './timelines/ProceduralTimelineEngine.js';
import { assignmentEngine } from './assignments/AssignmentEngine.js';
import { taskEngine } from './tasks/TaskEngine.js';
import { deadlineEngine } from './deadlines/DeadlineEngine.js';
import { hearingFoundation } from './hearings/HearingFoundation.js';
import { clientCommunicationEngine } from './communications/ClientCommunicationEngine.js';
import { negotiationEngine } from './negotiations/NegotiationEngine.js';
import { agreementEngine } from './agreements/AgreementEngine.js';
import { legalSlaEngine } from './sla/LegalSlaEngine.js';
import { caseAnalyticsEngine } from './analytics/CaseAnalyticsEngine.js';
import { productivityEngine } from './productivity/ProductivityEngine.js';
import { caseMonitoringEngine } from './monitoring/CaseMonitoringEngine.js';
import { caseRiskEngine } from './risk/CaseRiskEngine.js';
import { collaborationFoundation } from './collaboration/CollaborationFoundation.js';
import { caseTelemetry } from './telemetry/CaseTelemetry.js';
import { listLegalDomainEntities } from './LegalOperationsDomainModel.js';

let mounted = false;
let offs = [];

function trace(event, payload = {}, envelope = {}) {
  const tenant_id = envelope.tenant_id || payload.tenant_id || 'hmadv';
  const actor_id = envelope.actor_id || payload.actor_id || 'system';

  proceduralTimelineEngine.add({
    type: event,
    tenant_id,
    case_id: payload.case_id || null,
    actor_id,
    workflow_state: payload.workflow_state || null,
    financial_state: payload.financial_state || null,
    onboarding_state: payload.onboarding_state || null,
    risk_state: payload.risk_state || null,
    details: payload,
  });

  caseTelemetry.track({
    event,
    tenant_id,
    case_id: payload.case_id || null,
    actor_id,
    workflow_state: payload.workflow_state || null,
    financial_state: payload.financial_state || null,
    onboarding_state: payload.onboarding_state || null,
    risk_state: payload.risk_state || null,
    inputs: payload,
    outputs: {},
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountLegalOperationsFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('case.created', (payload, envelope) => {
      caseEngine.create(payload);
      trace('case.created', payload, envelope);
    }),
    bus.on('case.transitioned', (payload, envelope) => {
      caseEngine.transition(payload.case_id, payload.status, envelope.actor_id || 'system');
      trace('case.transitioned', payload, envelope);
    }),
    bus.on('task.updated', (payload, envelope) => {
      taskEngine.updateStatus(payload.task_id, payload.status, envelope.actor_id || 'system');
      trace('task.updated', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => trace('document.uploaded', payload, envelope)),
    bus.on('negotiation.updated', (payload, envelope) => trace('negotiation.updated', payload, envelope)),
    bus.on('agreement.signed', (payload, envelope) => trace('agreement.signed', payload, envelope)),
    bus.on('hearing.scheduled', (payload, envelope) => trace('hearing.scheduled', payload, envelope)),
    bus.on('sla.breached', (payload, envelope) => {
      legalSlaEngine.track({ ...payload, status: 'overdue' });
      trace('sla.breached', payload, envelope);
    }),
  ];
}

export function unmountLegalOperationsFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectLegalOperationsSnapshot(tenant_id = 'hmadv') {
  const cases = caseEngine.list(tenant_id);
  const clients = clientOpsEngine.list(tenant_id);
  const journeys = clientJourneyEngine.list(tenant_id);
  const procedures = proceduralEngine.list(tenant_id);
  const assignments = assignmentEngine.list(tenant_id);
  const tasks = taskEngine.list(tenant_id);
  const deadlines = deadlineEngine.list(tenant_id);
  const hearings = hearingFoundation.list(tenant_id);
  const communications = clientCommunicationEngine.list(tenant_id);
  const negotiations = negotiationEngine.list(tenant_id);
  const agreements = agreementEngine.list(tenant_id);
  const collaboration = collaborationFoundation.list(tenant_id);

  return {
    domain_entities: listLegalDomainEntities(),
    lifecycle: {
      total: cases.length,
      active: cases.filter((entry) => !['completed', 'archived'].includes(entry.status)).length,
      completed: cases.filter((entry) => entry.status === 'completed').length,
      archived: cases.filter((entry) => entry.status === 'archived').length,
      list: cases,
    },
    clients,
    journeys,
    procedures,
    assignments,
    tasks: {
      total: tasks.length,
      open: tasks.filter((entry) => entry.status !== 'completed').length,
      overdue: tasks.filter((entry) => entry.status === 'overdue').length,
      list: tasks,
    },
    deadlines,
    hearings,
    communications,
    negotiations,
    agreements,
    collaboration,
    timeline: { total: proceduralTimelineEngine.list(tenant_id).length, list: proceduralTimelineEngine.list(tenant_id) },
    sla: legalSlaEngine.snapshot(tenant_id),
    risk: caseRiskEngine.snapshot(cases),
    productivity: productivityEngine.snapshot({ tasks, assignments }),
    monitoring: caseMonitoringEngine.evaluate({ cases, tasks, negotiations, deadlines }),
    analytics: caseAnalyticsEngine.snapshot({ cases, journeys, negotiations, agreements }),
    telemetry: caseTelemetry.snapshot(tenant_id),
    generated_at: new Date().toISOString(),
  };
}

export const legalOperationsFoundation = {
  mount: mountLegalOperationsFoundation,
  unmount: unmountLegalOperationsFoundation,
  snapshot: collectLegalOperationsSnapshot,
};
