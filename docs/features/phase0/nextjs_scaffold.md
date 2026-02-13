# Feature: Next.js scaffold (App Router)

## Milestone Item

- Milestone: Phase 0 / 환경 구축
- Checkbox: Next.js 프로젝트 생성 (App Router)

## Summary

Minimal Next.js project with App Router and TypeScript. Scaffolding only: pnpm, no Tailwind, no auth/DB. Required folders from cursor.rule (app/, app/api/, lib/, components/, supabase/, docs/, scripts/) are present.

## Files Changed

- package.json
- app/layout.tsx
- app/page.tsx
- app/api/.gitkeep, lib/.gitkeep, components/.gitkeep, supabase/.gitkeep, docs/.gitkeep, scripts/.gitkeep
- .gitignore, next.config.ts, tsconfig.json, eslint.config.mjs, pnpm-lock.yaml, pnpm-workspace.yaml
- public/\* (default assets)
- require/VibeCopy_Development_Milestones.md

## How to Test

1. Run `pnpm install && pnpm build && pnpm lint` — all must pass.
2. Run `pnpm dev`, open http://localhost:3000 — page shows "VibeCopy" and "App Router + TypeScript scaffolding."

## Edge Cases / Known Limits

- `pnpm format` is a stub; add Prettier in a later milestone.
- Scaffold was merged into existing repo so `require/` was preserved.

## Screenshots (optional)

N/A

## Follow-ups (optional)

- TypeScript 설정 확인
- TailwindCSS 설정
- ESLint / Prettier 설정
