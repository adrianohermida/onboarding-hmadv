import { normalizeAlertPayload } from '../../shared/contracts/observability/AlertContracts.js';

const MAX_ALERTS = 500;

export class AlertEngine {
  constructor() {
    this._alerts = [];
  }

  raise(payload = {}) {
    const alert = normalizeAlertPayload(payload);
    this._alerts.unshift(alert);
    if (this._alerts.length > MAX_ALERTS) this._alerts.length = MAX_ALERTS;
    return alert;
  }

  close(code, reason = 'resolved') {
    this._alerts = this._alerts.map((item) => (
      item.code === code && item.status === 'open'
        ? { ...item, status: 'closed', closed_reason: reason, closed_at: new Date().toISOString() }
        : item
    ));
  }

  list(status = null) {
    if (!status) return [...this._alerts];
    return this._alerts.filter((item) => item.status === status);
  }

  evaluateMandatorySignals(snapshot = {}) {
    const alerts = [];
    if (snapshot?.workflow?.failed > 0) {
      alerts.push(this.raise({
        code: 'workflow.failure',
        title: 'Workflow failure detected',
        severity: 'high',
        source: 'workflows',
        description: 'One or more workflow executions failed.',
      }));
    }
    if (snapshot?.latency?.p95_ms > 2500) {
      alerts.push(this.raise({
        code: 'latency.high',
        title: 'High latency detected',
        severity: 'high',
        source: 'performance',
        description: `P95 latency is ${snapshot.latency.p95_ms}ms`,
      }));
    }
    if (snapshot?.security?.suspicious_access > 0) {
      alerts.push(this.raise({
        code: 'security.suspicious_access',
        title: 'Suspicious access detected',
        severity: 'critical',
        source: 'security',
        description: 'Suspicious access attempts detected.',
      }));
    }
    return alerts;
  }
}

export const alertEngine = new AlertEngine();
