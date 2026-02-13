# Feature: FAQ Page (Phase 6)

## Milestone Item
- Milestone: Phase 6 / 베타 출시 준비
- Checkbox: FAQ 문서 작성

## Summary
SEO-friendly FAQ page at `/faq` with H1 "VibeCopy 자주 묻는 질문 (FAQ)", seven sections (무료 사용, 크레딧 리셋, 생성 결과 저장, 결제 안전성, 지원 채널, 입력 방법, 환불 정책), semantic dl/dt/dd, and final CTA "무료로 3회 사용해보기" → /generate. Metadata: title, description, openGraph. Footer link "FAQ" → /faq on landing. No backend; Tailwind only, mobile-first.

## Files Changed
- app/faq/page.tsx (metadata + content)
- app/(marketing)/page.tsx (footer link)
- docs/features/phase6/faq_page.md

## How to Test
- Visit /faq → all 7 FAQs and CTA visible.
- Check document head for title/description/og tags.
- Landing footer: "FAQ" → /faq.

## Edge Cases
- Content is static. 환불 정책 is MVP 기준 안내 (문의 시 검토).
