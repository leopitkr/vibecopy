# Feature: Landing Page (Phase 6)

## Milestone Item
- Milestone: Phase 6 / 베타 출시 준비
- Checkbox: 랜딩 페이지 제작

## Summary
High-converting landing page at `/` using App Router group `(marketing)`. Includes Hero (headline, sub, CTAs), Problem section (PRD pain points), Result example (hardcoded headlines + CTA cards), Pricing preview (Free/Standard/Pro with links to /pricing), FAQ (6 items), and Final CTA. SEO metadata (title, description, openGraph). Mobile-first Tailwind only; no new backend logic.

## Files Changed
- app/(marketing)/layout.tsx (metadata)
- app/(marketing)/page.tsx (landing content)
- app/page.tsx (removed; root "/" now served by (marketing)/page.tsx)
- docs/features/phase6/landing_page.md

## How to Test
- Visit `/` → landing with Hero, Problem, Example, Pricing, FAQ, CTA.
- "지금 무료로 3회 사용하기" → /generate.
- "요금제 보기" → /pricing.
- Check mobile layout (flex-col, responsive grid).
- Check metadata in document head / social preview.

## Edge Cases
- Root layout (app/layout.tsx) unchanged; (marketing) layout only adds metadata for marketing routes.
- No heavy animations; Tailwind only.
