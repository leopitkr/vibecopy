# Feature: TailwindCSS 설정

## Milestone Item
- Milestone: Phase 0 / 환경 구축
- Checkbox: TailwindCSS 설정

## Summary
Tailwind CSS v4 wired via official Next.js setup: @tailwindcss/postcss in PostCSS, `@import "tailwindcss"` in globals.css. Global styles kept; minimal UI proof on home page (padding, typography, colors).

## Files Changed
- postcss.config.mjs (new)
- app/globals.css (@import "tailwindcss" at top)
- app/page.tsx (Tailwind classes for UI proof)
- package.json (devDeps: tailwindcss, postcss, autoprefixer, @tailwindcss/postcss)
- docs/features/phase0/tailwind_setup.md
- require/VibeCopy_Development_Milestones.md

## How to Test
1. `pnpm build` — succeeds.
2. `pnpm dev` — open http://localhost:3000: title is blue and large, paragraph gray with margin; layout has padding.

## Edge Cases / Known Limits
- Tailwind v4 is zero-config; no tailwind.config.ts (content auto-detected). Theme customizations can use CSS `@theme` later.

## Screenshots (optional)
N/A

## Follow-ups (optional)
- ESLint / Prettier 설정
- 환경변수(.env.local) 구조 정의
