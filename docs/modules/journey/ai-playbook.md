# AI Playbook: journey

- boundaries: modulo journey; sem duplicar contexto global
- dependencies: journey engine, event bus, shell contracts
- events: onboarding.completed, journey.step.*
- risks: quebra de fluxo do cliente
- prompts permitidos: journey-safe-refactor, onboarding-step-safe
- prompts proibidos: bypass de tenant ou auth
