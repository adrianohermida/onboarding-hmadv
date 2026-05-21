import { describe, expect, it } from 'vitest';
import { bus } from '../modules/events/EventBus.js';

describe('event foundation', () => {
  it('publishes envelope-compliant events through compatibility adapter', () => {
    const result = bus.publish('onboarding.started', { onboarding_id: 'ob-1' }, { tenant_id: 'hmadv' });

    expect(result.ok).toBe(true);
    expect(result.envelope.event).toBe('onboarding.started');
    expect(result.envelope.tenant_id).toBe('hmadv');
    expect(result.envelope.payload.onboarding_id).toBe('ob-1');
    expect(result.envelope.correlation_id).toBeTruthy();
  });

  it('supports replayFuture subscriptions', () => {
    let seen = null;
    bus.emit('notification.created', { message: 'x' }, { tenant_id: 'hmadv' });

    const off = bus.replayFuture('notification.created', (payload) => {
      seen = payload?.message || null;
    }, { replayLast: 1 });

    expect(seen).toBe('x');
    off();
  });
});
