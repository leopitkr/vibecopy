# Feature: ESLint / Prettier 설정

## Milestone Item
- Milestone: Phase 0 / 환경 구축
- Checkbox: ESLint / Prettier 설정

## Summary
Prettier added as the project formatter; eslint-config-prettier disables conflicting ESLint rules. Scripts updated: `pnpm format` runs Prettier, `pnpm lint` runs ESLint with `--max-warnings 0`. No new ESLint plugins; config minimal and production-ready.

## Files Changed
- package.json (lint, format, format:check scripts; devDeps: prettier, eslint-config-prettier)
- eslint.config.mjs (append eslint-config-prettier)
- .prettierrc (new)
- .prettierignore (new)
- Various files formatted by Prettier (docs, require, eslint.config.mjs)
- docs/features/phase0/eslint_prettier_setup.md
- require/VibeCopy_Development_Milestones.md

## How to Test
1. `pnpm format` — exits 0; runs Prettier on repo (idempotent on second run).
2. `pnpm format:check` — exits 0 when repo is formatted.
3. `pnpm lint` — exits 0 with no errors/warnings.
4. Run `pnpm format && pnpm lint` — both pass.

## Edge Cases / Known Limits
- ESLint runs on `.`; Prettier ignores .next, out, node_modules, pnpm-lock.yaml, .git per .prettierignore.

## Screenshots (optional)
N/A

## Follow-ups (optional)
- 환경변수(.env.local) 구조 정의
