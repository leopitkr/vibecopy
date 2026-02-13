# Feature: Beta Feedback Collection (Phase 6)

## Milestone Item
- Milestone: Phase 6 / 베타 출시 준비
- Checkbox: 피드백 수집 폼 연결

## Summary
Lightweight feedback collection for beta users: form at `/feedback` (사용 목적, 만족도 1–5, 좋았던 점/아쉬웠던 점/개선 요청, optional 이메일), POST to `/api/feedback` stored in `public.feedback`. RLS: insert for authenticated users, select own only. "피드백 보내기" link in landing footer; "서비스 개선을 위한 1분 피드백" link shown after successful generation. No change to core API logic.

## Files Changed
- supabase/migrations/20260213170000_feedback.sql
- app/api/feedback/route.ts
- app/feedback/page.tsx
- app/(marketing)/page.tsx (footer link)
- components/GeneratePageClient.tsx (post-result feedback link)
- docs/features/phase6/feedback_system.md

## How to Test
- Log in, visit /feedback, submit form → success message; row in feedback table.
- Log out, visit /feedback, submit → 401 or redirect to login (form POST returns 401).
- Landing footer: "피드백 보내기" → /feedback.
- After generating copy: "서비스 개선을 위한 1분 피드백" → /feedback.

## Edge Cases
- Optional fields (good, bad, request, email) can be empty; max lengths enforced (2000/256).
- Unauthenticated POST returns 401; no anonymous feedback in DB.
