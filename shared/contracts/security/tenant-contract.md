# Security Contract: Tenant

Every read/write path must include tenant awareness.

No module may:

- query across tenant boundary without explicit privileged path
- perform writes without tenant ownership verification
