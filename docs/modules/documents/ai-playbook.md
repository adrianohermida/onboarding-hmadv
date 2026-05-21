# AI Playbook: documents

- boundaries: workflow documental desacoplado
- dependencies: services/documents, event bus, shell contracts
- events: document.uploaded, document.approved, document.rejected
- risks: inconsistencias de status e compliance
- prompts permitidos: document-workflow-change, integration-safe-change
- prompts proibidos: alteracao de policy storage sem review
