const MAX_LOG_ENTRIES = 300;

export class EventLogger {
  constructor() {
    this._entries = [];
  }

  log(type, eventName, detail = {}) {
    this._entries.unshift({
      type,
      event: eventName,
      detail,
      ts: new Date().toISOString(),
    });
    if (this._entries.length > MAX_LOG_ENTRIES) this._entries.length = MAX_LOG_ENTRIES;
  }

  list() {
    return [...this._entries];
  }
}

export const eventLogger = new EventLogger();
