# Integration Module Requirements

Every new module must:
- use Integration Hub
- use adapters
- use contracts
- use observability
- use retries
- use telemetry

No module may:
- consume provider APIs directly
- create arbitrary fetch integration calls
- create insecure webhooks
- create tightly-coupled integration logic
