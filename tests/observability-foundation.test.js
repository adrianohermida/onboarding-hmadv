import { describe, expect, it } from 'vitest';
import { bus } from '../modules/events/EventBus.js';
import {
  mountObservabilityFoundation,
  collectOperationalSnapshot,
} from '../observability/ObservabilityFoundation.js';

describe('observability foundation', () => {
  it('captures upload failures into health and alerts', () => {
    mountObservabilityFoundation();

    bus.emit('upload.failed', { ms: 1800 }, { tenant_id: 'tenant-obs', trace_id: 'trace-test' });

    const snapshot = collectOperationalSnapshot();

    expect(snapshot.health.components.uploads.status).toBe('degraded');
    expect(snapshot.alerts.some((item) => item.code === 'upload.failure')).toBe(true);
  });

  it('tracks onboarding completion as business observability signal', () => {
    mountObservabilityFoundation();

    bus.emit('onboarding.completed', {}, { tenant_id: 'tenant-obs' });
    const snapshot = collectOperationalSnapshot();

    expect(snapshot.workflow).toBeTruthy();
    expect(snapshot.health.global).toBeTruthy();
  });
});
