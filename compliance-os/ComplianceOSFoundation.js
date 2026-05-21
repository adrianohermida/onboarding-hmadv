import { bus } from '../modules/events/EventBus.js';
import { lgpdGovernanceFoundation } from './lgpd/LgpdGovernanceFoundation.js';
import { consentEngine } from './consents/ConsentEngine.js';
import { privacyLayer } from './privacy/PrivacyLayer.js';
import { retentionGovernanceEngine } from './retention/RetentionGovernanceEngine.js';
import { auditabilityEngine } from './audit/AuditabilityEngine.js';
import { riskGovernanceEngine } from './risk/RiskGovernanceEngine.js';
import { complianceGovernanceEngine } from './governance/ComplianceGovernanceEngine.js';
import { dataClassificationEngine } from './classification/DataClassificationEngine.js';
import { securityComplianceMonitoring } from './security/SecurityComplianceMonitoring.js';
import { incidentFoundation } from './incidents/IncidentFoundation.js';
import { accessGovernanceEngine } from './access/AccessGovernanceEngine.js';
import { dataLineageFoundation } from './lineage/DataLineageFoundation.js';
import { complianceMonitoringEngine } from './monitoring/ComplianceMonitoringEngine.js';
import { complianceTelemetry } from './telemetry/ComplianceTelemetry.js';
import { complianceAnalyticsEngine } from './analytics/ComplianceAnalyticsEngine.js';
import { dataAccessReportsFoundation } from './reports/DataAccessReportsFoundation.js';
import { dataSubjectFoundation } from './policies/DataSubjectFoundation.js';
import { listComplianceDomainEntities } from './ComplianceDomainModel.js';

let mounted = false;
let offs = [];

function trace(event, payload = {}, envelope = {}) {
  complianceTelemetry.track({
    event,
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category: payload.category || 'audit',
    severity: payload.severity || 'info',
    violation: payload.violation === true,
    anomaly: payload.anomaly === true,
    trace_id: envelope.trace_id || envelope.correlation_id || payload.trace_id || null,
  });
}

export function mountComplianceOSFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('consent.updated', (payload, envelope) => {
      consentEngine.register(payload);
      trace('consent.updated', { ...payload, category: 'consent' }, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      auditabilityEngine.record({
        tenant_id: payload.tenant_id,
        actor: envelope.actor_id || payload.actor_id || 'system',
        action: 'document.uploaded',
        resource: 'document',
        resource_id: payload.document_id || null,
        after: payload,
        workflow: payload.workflow_state || null,
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      dataClassificationEngine.classify({
        tenant_id: payload.tenant_id,
        resource: 'document',
        resource_id: payload.document_id || null,
        classification: payload.classification || 'JURIDICO',
        actor_id: envelope.actor_id || payload.actor_id || 'system',
      });
      dataLineageFoundation.track({
        tenant_id: payload.tenant_id,
        origin: 'upload',
        transformation: 'document_intake',
        workflow: payload.workflow_state || null,
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      trace('document.uploaded', { ...payload, category: 'audit' }, envelope);
    }),
    bus.on('financial.updated.monthly', (payload, envelope) => {
      auditabilityEngine.record({
        tenant_id: payload.tenant_id,
        actor: envelope.actor_id || payload.actor_id || 'system',
        action: 'financial.updated.monthly',
        resource: 'financial',
        resource_id: payload.case_id || null,
        after: payload,
        workflow: payload.workflow_state || null,
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      dataClassificationEngine.classify({
        tenant_id: payload.tenant_id,
        resource: 'financial',
        resource_id: payload.case_id || null,
        classification: 'FINANCEIRO',
        actor_id: envelope.actor_id || payload.actor_id || 'system',
      });
      trace('financial.updated.monthly', { ...payload, category: 'audit' }, envelope);
    }),
    bus.on('integration.call.completed', (payload, envelope) => {
      dataLineageFoundation.track({
        tenant_id: payload.tenant_id,
        origin: 'integration',
        transformation: payload.integration || 'external_call',
        integration: payload.integration || null,
        workflow: payload.workflow_state || null,
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      trace('integration.call.completed', { ...payload, category: 'access' }, envelope);
    }),
    bus.on('security.incident.detected', (payload, envelope) => {
      incidentFoundation.register({
        tenant_id: payload.tenant_id,
        type: payload.type || 'security_incident',
        severity: payload.severity || 'high',
        description: payload.description || 'incident_detected',
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      trace('security.incident.detected', { ...payload, category: 'audit', anomaly: true, violation: true }, envelope);
    }),
    bus.on('resource.accessed', (payload, envelope) => {
      accessGovernanceEngine.record({
        tenant_id: payload.tenant_id,
        actor_id: envelope.actor_id || payload.actor_id || 'system',
        role: payload.role || 'support',
        resource: payload.resource || 'unknown',
        sensitivity: payload.sensitivity || 'INTERNO',
        action: payload.action || 'read',
        suspicious: payload.suspicious === true,
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      trace('resource.accessed', { ...payload, category: 'access', anomaly: payload.suspicious === true }, envelope);
    }),
  ];
}

export function unmountComplianceOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectComplianceOSSnapshot(tenant_id = 'hmadv') {
  const consents = consentEngine.list(tenant_id);
  const audit = auditabilityEngine.list(tenant_id);
  const risk = riskGovernanceEngine.list(tenant_id);
  const incidents = incidentFoundation.list(tenant_id);
  const access = accessGovernanceEngine.list(tenant_id);
  const lineage = dataLineageFoundation.list(tenant_id);
  const telemetry = complianceTelemetry.snapshot(tenant_id);
  const classifications = dataClassificationEngine.list(tenant_id);
  const retention = retentionGovernanceEngine.evaluate({ tenant_id, compliance_score: 100 });

  const monitoring = complianceMonitoringEngine.evaluate({
    access,
    audit,
    consents,
    incidents,
  });

  return {
    domain_entities: listComplianceDomainEntities(),
    lgpd: lgpdGovernanceFoundation.snapshot(),
    consents: { total: consents.length, accepted: consents.filter((entry) => entry.accepted && !entry.revoked).length, revoked: consents.filter((entry) => entry.revoked).length, list: consents },
    privacy: privacyLayer.evaluate({ tenant_isolation: true, secure_access: true, auditability: true }),
    retention,
    classification: { total: classifications.length, list: classifications },
    lineage: { total: lineage.length, list: lineage },
    audit: { total: audit.length, list: audit },
    risk: { total: risk.length, high: risk.filter((entry) => (entry.lgpd_risk + entry.leakage_risk + entry.ai_risk) >= 180).length, list: risk },
    access: { total: access.length, suspicious: access.filter((entry) => entry.suspicious).length, list: access },
    incidents: { total: incidents.length, open: incidents.filter((entry) => entry.status !== 'resolved').length, list: incidents },
    monitoring,
    security: securityComplianceMonitoring.evaluate({ access, telemetry: telemetry.list }),
    telemetry,
    analytics: complianceAnalyticsEngine.snapshot({
      consents,
      audit,
      access,
      retention,
      workflows: { compliance_score: 100 },
      integrations: { compliance_score: 100 },
    }),
    reports: dataAccessReportsFoundation.build({ access, audit, consents, retention }),
    data_subject_foundation: dataSubjectFoundation.capabilities(),
    governance: complianceGovernanceEngine.evaluate({ ai_compliance: true, integration_compliance: true, document_compliance: true, financial_compliance: true }),
    generated_at: new Date().toISOString(),
  };
}

export const complianceOsFoundation = {
  mount: mountComplianceOSFoundation,
  unmount: unmountComplianceOSFoundation,
  snapshot: collectComplianceOSSnapshot,
};
