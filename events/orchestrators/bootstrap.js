import { mountOnboardingOrchestrator } from './OnboardingOrchestrator.js';
import { mountDocumentOrchestrator } from './DocumentOrchestrator.js';
import { mountPaymentPlanOrchestrator } from './PaymentPlanOrchestrator.js';
import { mountCrossModuleSubscribers } from '../subscribers/CrossModuleSubscribers.js';
import { mountFreshdeskAutomationSubscribers } from '../subscribers/FreshdeskAutomationSubscribers.js';
import { mountOnboardingEventHandlers } from '../handlers/OnboardingEventHandlers.js';
import { mountDocumentsEventHandlers } from '../handlers/DocumentsEventHandlers.js';
import { mountFinancialEventHandlers } from '../handlers/FinancialEventHandlers.js';
import { mountNotificationEventHandlers } from '../handlers/NotificationEventHandlers.js';
import { mountAnalyticsEventHandlers } from '../handlers/AnalyticsEventHandlers.js';

let mounted = false;
let unmountFns = [];

export function mountEventOrchestration() {
  if (mounted) return;
  mounted = true;

  unmountFns = [
    mountOnboardingOrchestrator(),
    mountDocumentOrchestrator(),
    mountPaymentPlanOrchestrator(),
    mountCrossModuleSubscribers(),
    mountFreshdeskAutomationSubscribers(),
    mountOnboardingEventHandlers(),
    mountDocumentsEventHandlers(),
    mountFinancialEventHandlers(),
    mountNotificationEventHandlers(),
    mountAnalyticsEventHandlers(),
  ].filter(Boolean);
}

export function unmountEventOrchestration() {
  unmountFns.forEach((fn) => {
    try { fn(); } catch (_) {}
  });
  unmountFns = [];
  mounted = false;
}
