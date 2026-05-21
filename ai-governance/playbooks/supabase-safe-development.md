# Playbook: supabase-safe-development

- Prefer migrations-safe strategy.
- Never auto-alter RLS in production.
- Require security review for auth/storage policy changes.
- Include rollback strategy in every DB-affecting change.
