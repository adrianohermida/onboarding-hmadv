export const SHELL_EVENTS = Object.freeze({
  SHELL_READY: 'shell.ready',
  TENANT_CHANGED: 'tenant.changed',
  AUTH_CHANGED: 'auth.changed',
  ONBOARDING_COMPLETED: 'onboarding.completed',
  DOCUMENT_UPLOADED: 'document.uploaded',
  NOTIFICATION_CREATED: 'notification.created',
  DEBT_UPDATED: 'debt.updated',
});

export function isShellEvent(eventName) {
  return Object.values(SHELL_EVENTS).includes(eventName);
}

export default SHELL_EVENTS;
