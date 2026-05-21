# Component Ownership

The design system ownership model is split by governance responsibility.

## Ownership Rules

- UI foundation ownership covers tokens, themes, primitives, and reusable interaction states.
- Shell ownership covers navigation framing, overlays, loading layers, notifications, and layout contracts.
- Module teams may compose approved components, but must not fork or redefine system primitives.
- Accessibility and responsive compliance are mandatory review gates for any component change.

## Ownership Sources

- Component registry: `design-system/components/registry.json`
- Design review checklist: `governance/design/design-review-checklist.md`
- Shell visual rules: `governance/design/shell-visual-governance.md`

## Escalation

- Token changes require design system review.
- Shell-facing component changes require shell compatibility review.
- New primitives require governance approval before module adoption.