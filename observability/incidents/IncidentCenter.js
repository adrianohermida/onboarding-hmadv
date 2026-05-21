const MAX_INCIDENTS = 300;

export class IncidentCenter {
  constructor() {
    this._incidents = [];
  }

  open(payload = {}) {
    const incident = {
      incident_id: payload.incident_id || `inc_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      title: payload.title || 'Untitled incident',
      severity: payload.severity || 'medium',
      owner: payload.owner || 'platform',
      status: 'open',
      timeline: [{ action: 'opened', at: new Date().toISOString(), detail: payload.detail || '' }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this._incidents.unshift(incident);
    if (this._incidents.length > MAX_INCIDENTS) this._incidents.length = MAX_INCIDENTS;
    return incident;
  }

  addTimeline(incident_id, action, detail = '') {
    this._incidents = this._incidents.map((item) => (
      item.incident_id === incident_id
        ? {
            ...item,
            timeline: [...item.timeline, { action, detail, at: new Date().toISOString() }],
            updated_at: new Date().toISOString(),
          }
        : item
    ));
  }

  resolve(incident_id, detail = 'resolved') {
    this._incidents = this._incidents.map((item) => (
      item.incident_id === incident_id
        ? {
            ...item,
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            timeline: [...item.timeline, { action: 'resolved', detail, at: new Date().toISOString() }],
            updated_at: new Date().toISOString(),
          }
        : item
    ));
  }

  snapshot() {
    return {
      open: this._incidents.filter((item) => item.status === 'open').length,
      resolved: this._incidents.filter((item) => item.status === 'resolved').length,
      list: [...this._incidents],
    };
  }
}

export const incidentCenter = new IncidentCenter();
