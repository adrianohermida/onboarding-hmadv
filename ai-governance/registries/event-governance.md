# AI Event Governance

AI agents must not:

- create arbitrary events without registry entry
- duplicate event semantics with new names
- create event loops across modules
- bypass event contracts

## Process for New Event

1. Propose event in PR with purpose and payload schema.
2. Check overlap with existing events.
3. Run loop-risk assessment.
4. Update contracts and module playbooks.
5. Obtain architecture review approval.
