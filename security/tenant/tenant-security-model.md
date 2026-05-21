# Tenant Security Model

## Requirements

- strict tenant isolation for data and files
- tenant-aware read/write contracts
- tenant ownership checks for resource actions
- explicit tenant context propagation on service calls

## Prohibited

- cross-tenant fallback reads
- tenant override without audited impersonation flow
