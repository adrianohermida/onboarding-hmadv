# AI Contracts

AI-generated code must satisfy all contracts below.

## Shell Boundary Contract

- Do not recreate sidebar/header/providers outside shell.
- Do not add parallel global contexts.
- Use shell contracts for modal/slideover/events/loading.

## Module Boundary Contract

- Each module change must remain inside module scope.
- New module requires module.manifest.json and documented dependencies.

## Tenant Boundary Contract

- Preserve tenant isolation and workspace ownership checks.
- No cross-tenant joins or writes without explicit policy/ADR.

## Event Contract

- Reuse existing event names when semantic match exists.
- New events require registry update and loop-risk analysis.

## Observability Contract

- Include telemetry points for critical flows.
- Include failure path logging and rollback signal.
