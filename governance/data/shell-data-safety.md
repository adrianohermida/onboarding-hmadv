# Shell Data Safety

Shell must not own domain entities.

Shell responsibilities:

- orchestrate navigation and global context
- propagate tenant and auth context
- observe events and telemetry

Shell must not implement:

- financial domain logic
- onboarding entity rules
- direct schema mutation
