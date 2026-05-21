# Security Contract: Storage

All modules must:

- request signed URLs through approved service layer
- never expose permanent/public URLs for sensitive buckets
- validate mime, content, and file size
- ensure tenant/user scoped file paths
