# Feature: Usage Guide Page (Phase 6)

## Milestone Item
- Milestone: Phase 6 / 베타 출시 준비
- Checkbox: 이용 가이드 작성

## Summary
Detailed usage guide at `/guide` for new users: how to input (URL vs manual, good vs bad examples), channel selection (스마트스토어/쿠팡/공동구매/숏폼), vibe descriptions (신뢰형/후기형/자극형/프리미엄형/공구특화), risk_check explanation, credit policy (Free/Standard/Pro), and final CTA to /generate. Footer link "이용 가이드" added on landing. No backend changes; Tailwind only, mobile-first, semantic headings.

## Files Changed
- app/guide/page.tsx
- app/(marketing)/page.tsx (footer link)
- docs/features/phase6/usage_guide.md

## How to Test
- Visit /guide → all sections visible; "지금 카피 생성하러 가기" → /generate.
- Landing footer: "이용 가이드" → /guide.

## Edge Cases
- Content is static; no i18n. Links to /pricing and / in guide.
