# AI Playbook: dashboard

- boundaries: modulo dashboard; sem alteracao de shell internals
- dependencies: services/database, shell contracts
- events: listens auth.changed; emits notification.created (quando aplicavel)
- risks: regressao de KPI e UX desktop/mobile
- prompts permitidos: analytics-safe-instrumentation, shell-safe-change
- prompts proibidos: alteracao direta de RLS/auth
