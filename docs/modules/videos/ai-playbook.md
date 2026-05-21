# AI Playbook: videos

- boundaries: modulo videos isolado da governanca central
- dependencies: journey/events
- events: video.ready, video.progress, video.completed
- risks: performance e sincronizacao de progresso
- prompts permitidos: journey-safe-refactor, analytics-safe-instrumentation
- prompts proibidos: acoplamento direto ao shell internals
