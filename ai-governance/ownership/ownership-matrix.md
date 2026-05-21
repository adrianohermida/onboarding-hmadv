# AI Ownership Matrix

## Ownership Rules

- Every AI change must have a responsible agent and a human approver.
- Ownership is by domain, never global.
- Cross-domain changes require dual review.

## Matrix

| Domain | Primary Agent | Required Secondary Review | Human Approval |
|---|---|---|---|
| Shell architecture | Claude Architect | Security Review Agent | Tech lead |
| Prompt templates/playbooks | PromptOps Agent | Claude Architect | Tech lead |
| Financial/debt engine | Financial Engine Agent | MultiTenant Review Agent | Product + tech lead |
| Documents workflows | Documents Agent | Security Review Agent | Product + tech lead |
| Supabase changes | Supabase Governance Agent | Security Review Agent | Data owner |
| UI refactors | UI Refactor Agent | Claude Architect | Module owner |

## Escalation

1. Policy violation -> Security Review Agent blocks change.
2. Boundary uncertainty -> Claude Architect defines ADR.
3. Tenant risk -> MultiTenant Review Agent mandatory sign-off.
