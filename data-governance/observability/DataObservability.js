const MAX_ERRORS = 300;

export class DataObservability {
  constructor() {
    this._errors = [];
  }

  report(type, detail = {}) {
    this._errors.unshift({ type, detail, ts: new Date().toISOString() });
    if (this._errors.length > MAX_ERRORS) this._errors.length = MAX_ERRORS;
  }

  list() {
    return [...this._errors];
  }
}

export const dataObservability = new DataObservability();
