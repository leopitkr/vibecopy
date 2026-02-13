# Feature: Next.js project creation (App Router)

## Milestone Item
- Milestone: Phase 0 / 환경 구축
- Checkbox: Next.js 프로젝트 생성 (App Router)

## Summary
Scaffolded a minimal Next.js app with App Router and TypeScript. No Tailwind, auth, or DB. Uses pnpm. Required folders from cursor.rule (app/, app/api/, lib/, components/, supabase/, docs/, scripts/) are present.

## Files Changed
- package.json (name: vibecopy, format script added)
- app/layout.tsx (metadata title/description)
- app/page.tsx (minimal home page)
- app/api/.gitkeep, lib/.gitkeep, components/.gitkeep, supabase/.gitkeep, docs/.gitkeep, scripts/.gitkeep
- (Rest: create-next-app defaults + .gitignore, tsconfig, next.config, eslint)

## How to Test
1. `pnpm install && pnpm build && pnpm lint` — all pass.
2. `pnpm dev` — open http://localhost:3000 and see "VibeCopy" and "App Router + TypeScript scaffolding."

## Edge Cases / Known Limits
- Formatter: `pnpm format` is a stub; add Prettier in next milestone.
- Scaffold was created in a sibling dir and rsync’d in so existing `require/` was preserved.

## Follow-ups
- TypeScript 설정 확인 (next Phase 0 item)
- TailwindCSS 설정
- ESLint / Prettier 설정
