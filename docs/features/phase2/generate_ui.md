# Feature: Generate page UI

## Milestone Items
- Phase 2 / UI 구현: 입력 폼 (URL/상품설명), 채널 선택 UI, 바이브 선택 UI, 결과 출력 레이아웃 구성, 복사 버튼 기능, 로딩 상태 표시

## Summary
Production-ready Generate page at `/generate`: form (URL or manual product name + bullets + price + target), Channel and Vibe pickers using CHANNEL_CONSTRAINTS and VIBE_PRESETS, CreditBadge (GET /api/me), POST /api/generate with idempotency_key, CopyPackageView with per-section and full-package copy, loading overlay, upgrade modal on 402/429, retry on AI_FAILED reusing same idempotencyKey. Mobile-first, Tailwind, accessible (focus ring, labels, aria-busy).

## Files Changed
- app/api/me/route.ts
- app/generate/page.tsx
- components/GeneratePageClient.tsx
- components/CreditBadge.tsx
- components/ChannelPicker.tsx
- components/VibePresetPicker.tsx
- components/CopyPackageView.tsx
- lib/ui/generateClient.ts
- docs/features/phase2/generate_ui.md

## How to Test
- (UI-1) Log in, open /generate, ensure credits >0; submit form; see results and copy buttons.
- (UI-2) Free user: 4th generation in same day -> 429; upgrade modal with link to /pricing.
- (UI-3) Simulate AI failure or network error -> error message + 재시도; retry uses same key (no double charge).
- (UI-4) Click copy on each section and full package; paste to verify.
- (UI-5) Submit -> loading overlay and disabled button until response.

## Edge Cases
- /pricing may not exist yet (link present for upgrade).
- Brand voice not implemented (optional in spec).
