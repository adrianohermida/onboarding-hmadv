import { bus } from '../../modules/events/EventBus.js';
import { SHELL_EVENTS, isShellEvent } from './ShellEvents.js';

export class ShellEventHub {
  emit(eventName, detail = {}) {
    if (!isShellEvent(eventName)) {
      bus.emit('notification.created', {
        type: 'warn',
        message: `Evento nao registrado no shell: ${eventName}`,
      });
    }
    bus.emit(eventName, detail);
  }

  on(eventName, handler) {
    return bus.on(eventName, handler);
  }

  off(eventName, handler) {
    return bus.off(eventName, handler);
  }

  once(eventName, handler) {
    return bus.once(eventName, handler);
  }
}

export const shellEventHub = new ShellEventHub();
export { SHELL_EVENTS };
export default shellEventHub;
