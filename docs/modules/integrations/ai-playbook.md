# AI Playbook: integrations

- boundaries: adaptadores seguros; sem secrets no codigo
- dependencies: edge functions, service layer
- events: notification.created, integration status events
- risks: timeout, retries inadequados, vazamento de dados
- prompts permitidos: integration-safe-change, security-review-prompt
- prompts proibidos: alteracao direta em producao
