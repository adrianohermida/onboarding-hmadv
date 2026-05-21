# AI Shell Policy

AI must not:

- recreate sidebar or header outside shell
- duplicate global providers
- break shell lifecycle
- duplicate layout/context in modules

## Mandatory

- use shared shell contracts
- preserve module boundaries
- preserve lazy loading behavior
- keep shell free from heavy domain logic
