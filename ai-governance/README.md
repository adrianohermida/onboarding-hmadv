# AI Governance Layer

This directory defines the AI Operating System foundation for the Portal HMADV.

## Purpose

Enable AI-assisted development with enterprise controls for:
- architecture integrity
- shell and module boundaries
- tenant isolation
- security and auditability
- review gates and release safety

## Core Rules

- AI cannot modify production directly.
- AI cannot change RLS, critical auth, or shell internals without explicit review.
- AI cannot generate modules without manifest, contracts, observability, permissions, and ownership.
- Every AI-generated change must include impact analysis and rollback strategy.

## Operating Flow

1. Claude: architecture and governance
2. Codex: implementation and scaffolding
3. Claude: audit and compliance review
4. Pull Request: human validation
5. Staging: homologation
6. Production: controlled deploy
