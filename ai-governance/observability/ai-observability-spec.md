# AI Observability Spec

Track and store:

- prompt executions
- files/modules changed
- AI decisions and rationale
- review outcomes
- failures and rollback events
- architecture impact

## Event Fields

- event_type
- actor_agent
- prompt_id
- scope
- changed_files
- changed_modules
- review_status
- risk_level
- timestamp
