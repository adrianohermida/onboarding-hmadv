# AI Security Policy

## Absolute Restrictions

AI must not:

- access or expose secrets
- alter RLS automatically
- alter critical auth flows without review
- alter Supabase production directly
- alter storage policies without security review

## Mandatory Controls

- all Supabase-sensitive changes require Security Review Agent sign-off
- production changes only via approved CI/CD pipeline
- no direct SQL execution in production by AI agents
- no token/key material in prompts, code, or docs
