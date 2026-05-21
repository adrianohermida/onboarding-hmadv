# AI Multi-tenant Policy

All AI-generated code must:

- preserve tenant isolation
- preserve workspace ownership and access boundaries
- preserve RLS assumptions
- preserve tenant branding boundaries

## Prohibited

- cross-tenant data reads/writes without explicit governance approval
- hardcoded tenant bypasses
- global caches without tenant partition keys
