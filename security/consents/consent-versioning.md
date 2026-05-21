# Consent Versioning

Each consent term must include:

- version_id
- published_at
- changelog
- requires_reaccept
- active_flag

When requires_reaccept is true, workflow must block protected actions until renewed acceptance.
