# Feature: History + Dashboard (Phase 4)

## Milestone Items
- Phase 4: 생성 기록 조회 페이지, 날짜순 정렬, 재생성 버튼, 사용자 플랜 표시, 크레딧 잔액 표시, 사용량 통계 표시

## Summary
History page (/history) lists user generations (newest first), with detail modal (CopyPackageView + RegenerateButton). Dashboard (/dashboard) shows plan (PlanBadge), credits (CreditBadge), quick links to /generate and /pricing, recent 5 generations, and UsageStats (last 7 days + this month counts). APIs: GET /api/generations (paginated, cursor), GET /api/generations/[id], GET /api/generations/stats. RLS respected (server client, no service role). cursor.rule checked.

## Files Changed
- app/api/generations/route.ts
- app/api/generations/[id]/route.ts
- app/api/generations/stats/route.ts
- app/history/page.tsx
- app/dashboard/page.tsx
- components/GenerationsList.tsx
- components/GenerationDetailModal.tsx
- components/RegenerateButton.tsx
- components/PlanBadge.tsx
- components/UsageStats.tsx
- docs/features/phase4/history_dashboard.md

## How to Test
- (H-1) Create 2-3 generations in /generate.
- (H-2) /history shows them in newest-first order.
- (H-3) Open detail: correct output sections and copy buttons work.
- (H-4) Regenerate: new generation record, new idempotency_key (no double-charge).
- (H-5) /dashboard shows plan + credits and recent generations.
- (H-6) Pagination: limit 20, nextCursor loads more.

## Edge Cases
- No generations: history shows empty message with link to /generate.
- Missing output: has_output false; detail still loads if row exists.
- RLS: only own rows returned (server client with user session).
- Not logged in: APIs return 401; dashboard/history show empty or login prompt.
