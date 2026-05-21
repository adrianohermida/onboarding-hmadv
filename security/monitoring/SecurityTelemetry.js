export class SecurityTelemetry {
  track(eventType, payload = {}) {
    window.__securityTelemetry = window.__securityTelemetry || [];
    window.__securityTelemetry.push({ eventType, payload, ts: Date.now() });
  }
}

export const securityTelemetry = new SecurityTelemetry();
export default securityTelemetry;
