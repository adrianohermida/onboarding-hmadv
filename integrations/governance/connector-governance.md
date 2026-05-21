# Connector Governance

Connectors cannot:
- access shell directly
- access private store internals
- access arbitrary tables
- break tenant isolation
- execute hidden side-effects

All connectors must be tenant-aware and auditable.
