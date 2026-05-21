export const OBSERVABLE_WORKFLOWS = [
  'onboarding',
  'documents',
  'financial',
  'signature',
  'notification',
  'support',
];

export function isObservableWorkflow(name) {
  return OBSERVABLE_WORKFLOWS.includes(String(name || '').trim());
}
