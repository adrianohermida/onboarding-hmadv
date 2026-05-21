import { obs } from '../observability/Observability.js';

export class GlobalErrorBoundary {
  mount() {
    if (window.__shellErrorBoundaryMounted) return;
    window.__shellErrorBoundaryMounted = true;

    window.addEventListener('error', event => {
      obs.error('global.error', {
        message: event?.message || 'unknown',
        file: event?.filename || '',
        line: event?.lineno || 0,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      obs.error('global.unhandledrejection', {
        reason: String(event?.reason || 'unknown'),
      });
    });
  }
}

export const globalErrorBoundary = new GlobalErrorBoundary();
export default globalErrorBoundary;
