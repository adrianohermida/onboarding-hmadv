# Event Governance

Mandatory:

- domain.action naming convention
- typed envelope for all events
- tenant-aware payloads
- correlation/request/workflow identifiers
- retry and dead-letter strategy for failures

Forbidden:

- direct cross-module coupling
- hidden side-effects
- inline workflow execution without orchestration
