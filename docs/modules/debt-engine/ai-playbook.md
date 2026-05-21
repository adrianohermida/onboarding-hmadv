# AI Playbook: debt-engine

- boundaries: engine isolada e testavel
- dependencies: event bus, data contracts
- events: debt.*
- risks: inconsistencia de estado e calculos
- prompts permitidos: debt-engine-safe-change
- prompts proibidos: escrita cross-tenant
