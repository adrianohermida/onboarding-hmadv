# AI Playbook: dividas

- boundaries: dominio de dividas no proprio modulo/engine
- dependencies: debt-engine, financial
- events: debt.created, debt.updated, debt.deleted
- risks: loops de evento e regressao de UX
- prompts permitidos: debt-engine-safe-change, financial-safe-evolution
- prompts proibidos: eventos arbitrarios fora contrato
