# AI Safe Development Flow

Official flow:

1. Claude -> architecture and boundaries
2. Codex -> implementation and scaffolding
3. Claude -> audit and governance review
4. GitHub PR -> peer review
5. Staging -> homologation
6. Production -> controlled deployment

## Required Artifacts per Change

- changelog
- impact analysis
- dependency analysis
- rollback strategy
