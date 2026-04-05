# VibeCopy 요금제/크레딧 정책 v2 - 작업 보고서

> 작성일: 2026-04-05
> 작업 범위: 요금제 정책 전면 수정 + 업셀 UX 반영

---

## 1. 작업 배경

기존 정책(Free 일간 1회, Standard 100/월, Pro 무제한)을 전면 교체.
새 정책: Free 10/월, Trial 5/일(7일), Standard 300/월, Pro 1,000/월.

## 2. 완료된 작업

### A. 정책 중앙화

**`lib/constants/limits.ts`** - 단일 정책 소스

| 플랜 | 제한 | 모델 | 가격 |
|------|------|------|------|
| Free | 10/월 | gpt-4o-mini | 0원 |
| Trial | 5/일 (7일간) | gpt-4o | 0원 |
| Standard | 300/월 | gpt-4o | 19,000원 |
| Pro | 1,000/월 | gpt-4o | 49,000원 |

**`lib/billing/plans.ts`** - Stripe 크레딧 할당
- `PLAN_CREDITS`: free=10, standard=300, pro=1000

### B. 서버 강제 로직 (DB RPC)

**`supabase/migrations/20260405100000_new_plan_policy.sql`**

- Free (non-trial): `usage_ledger` 이번 달 count >= 10 → `MONTHLY_LIMIT_EXCEEDED`
- Trial: `usage_ledger` 오늘 count >= 5 → `DAILY_LIMIT_EXCEEDED`
- Standard/Pro: `credit_balance` < 1 → `INSUFFICIENT_CREDITS`
- KST(Asia/Seoul) 기준 일간/월간 경계 계산
- Free 계정은 credit_balance 미사용 (count-based)

### C. /api/me 응답 보강

추가된 필드:
- `is_trial_active`, `effective_model`
- `monthly_limit`, `daily_trial_limit`
- `remaining_monthly_credits`, `remaining_daily_trial_credits`
- `upgrade_cta_type` (trial_daily_exhausted / free_monthly_exhausted / trial_ended 등)

### D. 업셀 UX

| 시나리오 | UI | 문구 |
|----------|-----|------|
| Trial 일간 소진 | 모달 | "오늘 체험 생성 5회를 모두 사용했어요" → Standard 300회 |
| Free 월간 소진 | 모달 | "이번 달 무료 10회를 모두 사용했어요" → Standard 300회 + gpt-4o |
| Trial 종료 | 배너 | "체험판이 종료되었습니다. Free 플랜으로 월 10회..." |
| 유료 소진 | 모달 | "이번 달 크레딧을 모두 사용했어요" → Pro 업셀 |
| 잔여 횟수 | 뱃지/힌트 | "이번 달 X/10회 남음" 또는 "오늘 X/5회 남음" |

### E. 수정된 파일 목록 (14개)

| 파일 | 변경 요약 |
|------|-----------|
| `lib/constants/limits.ts` | 정책 중앙화, PlanLimitType에서 unlimited 제거 |
| `lib/billing/plans.ts` | PLAN_CREDITS 갱신 |
| `lib/db/credits.ts` | MONTHLY_LIMIT_EXCEEDED 타입 추가 |
| `lib/ui/generateClient.ts` | ApiErrorCode에 MONTHLY_LIMIT_EXCEEDED 추가 |
| `lib/openai/client.ts` | 변경 없음 (getModelForPlan 그대로 호환) |
| `supabase/migrations/20260405100000_new_plan_policy.sql` | 새 debit_credits RPC |
| `app/api/me/route.ts` | 월간/일간 remaining 계산, 응답 필드 확장 |
| `app/api/generate/route.ts` | MONTHLY_LIMIT_EXCEEDED 에러 핸들링 |
| `components/CreditBadge.tsx` | 월간 표시 갱신 |
| `components/GeneratePageClient.tsx` | 업셀 모달 3분기, 문구 전면 갱신 |
| `components/RegenerateButton.tsx` | 업셀 문구 300회 반영 |
| `app/pricing/page.tsx` | 4칼럼(Free/Trial/Standard/Pro) 재작성 |
| `app/(marketing)/page.tsx` | 체험 문구 갱신 |
| `app/faq/page.tsx` | FAQ 정책 문구 갱신 |
| `app/guide/page.tsx` | 이용 가이드 크레딧 정책 갱신 |
| `app/login/page.tsx` | 체험 혜택 문구 갱신 |

---

## 3. 알려진 한계/아쉬운 점

### 이원화된 차감 방식
- Free/Trial: count-based (usage_ledger 집계)
- Standard/Pro: credit_balance based
- 장기적으로 "유료도 usage_ledger count-based" 단일화가 더 깔끔함

### Stripe 동기화 미검증
- UI는 300/1000으로 표시하지만 Stripe 대시보드의 price/product 설정은 아직 구버전일 수 있음
- webhook의 PLAN_CREDITS는 코드상 갱신됐으나, 실제 Stripe price ID와의 매핑 검증 필요

### 업셀 카피 고도화 미완
- 현재는 정적 문구
- "직전 사용 결과와 연결된 문구", "지금 업그레이드하면 바로 이어서 생성 가능" 등 미반영

---

## 4. 다음 작업 우선순위

| 순위 | 작업 | 이유 |
|------|------|------|
| **1** | Stripe price/webhook/plan sync 검증 및 수정 | 정책↔과금 불일치 시 매출 구조 틀어짐 |
| **2** | 유료 플랜 월 리셋 실제 검증 | Standard 300, Pro 1000이 invoice.paid 시 정확히 반영되는지 |
| **3** | Free 히스토리 30개 제한 구현 | Free를 무료답게 유지하는 운영 장치 |
| **4** | 업셀 모달 카피 고도화 | 매출 전환 최적화 |
| **5** | Pro 전용 기능 구조 (브랜드보이스/CSV/A/B) | 플랜 차별화 |
| **6** | pricing 4칼럼 모바일 반응형 | UX 완성도 |
