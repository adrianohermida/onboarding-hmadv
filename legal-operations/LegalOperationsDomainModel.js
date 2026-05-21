const LEGAL_DOMAIN_ENTITIES = [
  'Case',
  'CaseLifecycle',
  'CaseOwnership',
  'ClientJourney',
  'ProceduralFlow',
  'ProceduralTimeline',
  'LegalTask',
  'Deadline',
  'Hearing',
  'Negotiation',
  'Agreement',
  'LegalSla',
  'CaseRisk',
  'CaseAnalytics',
  'CaseTelemetry',
  'CollaborationNote',
  'CommunicationEvent',
];

export function listLegalDomainEntities() {
  return [...LEGAL_DOMAIN_ENTITIES];
}

export default LEGAL_DOMAIN_ENTITIES;
