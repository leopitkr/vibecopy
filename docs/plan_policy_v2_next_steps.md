# VibeCopy 정책 v2 - 2차 작업 결과 보고

> 작성일: 2026-04-05
> 선행 작업: plan_policy_v2.md (정책 반영 1차 완료)

---

## 목표

"정책 반영 1차 완료" → "과금/권한/월 리셋까지 포함한 상용 준비 완료"

---

## 작업 1: Stripe webhook/plan sync 정합성 [완료]

### 수정 내용

**`app/api/billing/webhook/route.ts`**

1. **`invoice.paid` 핸들러 리팩터링**: userId 경로 중복 제거, 로깅 추가
   - `PLAN_CREDITS[plan]` = Standard 300, Pro 1000 정확히 반영됨
   - `console.log("[webhook] invoice.paid: plan=%s credits=%d uid=%s")` 추가

2. **`subscription.updated`에 users.plan 즉시 동기화 추가**:
   - 기존: subscriptions 테이블만 갱신 → users.plan은 invoice.paid까지 gap
   - 수정: active 상태의 유료 구독 변경 시 users.plan도 즉시 동기화
   - Stripe 대시보드에서 직접 플랜 변경 시에도 동기화됨

3. **`subscription.deleted`**: plan='free', credit_balance=0 — 정상 동작 확인

### Stripe 대시보드 체크리스트 (수동 필요)
- [ ] Standard product price = 19,000 KRW/month
- [ ] Pro product price = 49,000 KRW/month
- [ ] 환경변수 `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_PRO` 최신값 확인

---

## 작업 2: 업/다운그레이드 시나리오 정합성 [완료]

### 검증 결과

| 시나리오 | 경로 | plan | credit_balance | limit | 상태 |
|----------|------|------|----------------|-------|------|
| 신규 가입 (Trial) | signup | free | 0 | 5/day count | OK |
| Trial 종료 → Free | 자동 | free | 0 | 10/month count | OK |
| Free → Standard | checkout+invoice.paid | standard | 300 | credit_balance | OK |
| Standard → Pro | sub.updated+invoice.paid | pro | 1000 | credit_balance | OK |
| Pro → 취소 | sub.deleted | free | 0 | 10/month count | OK |
| 월 갱신 | invoice.paid | same | reset | credit_balance | OK |
| OpenAI 실패 환불 (Free) | refund_credits | free | 0 | count-1 | OK |
| OpenAI 실패 환불 (Paid) | refund_credits | same | +1 | credit_balance | OK |

### 발견 및 수정한 버그

**Free 사용자 refund 시 debit count 미복구 문제**

- 문제: Free 사용자가 생성 시 OpenAI 실패 → refund 실행 → debit 레코드가 남아 한도 차감
- 원인: count 쿼리가 refund된 debit를 제외하지 않음
- 수정: `debit_credits` RPC의 count 쿼리에 `NOT EXISTS (refund entry)` 추가
- `/api/me`도 동일하게 debit-refund 차감 방식으로 수정

**수정 파일:**
- `supabase/migrations/20260405100000_new_plan_policy.sql` — refund-aware count
- `app/api/me/route.ts` — refund-aware remaining 계산

---

## 작업 3: Free 히스토리 30개 제한 [완료]

### 구현

- **`app/api/generations/route.ts`**: 사용자 plan 조회 → `HISTORY_LIMITS[plan]` 적용
  - Free: 최대 30개까지만 반환, pagination cap 적용
  - Standard/Pro: 제한 없음
  - 응답에 `historyLimit`, `historyLimitReached` 필드 추가

- **`components/GenerationsList.tsx`**: 제한 도달 시 업그레이드 안내
  - "무료 플랜은 최근 30개 기록만 볼 수 있습니다"
  - "Standard로 업그레이드하면 전체 기록 보기" 링크

---

## 작업 4: 업셀 모달 카피 고도화 [완료]

### 개선 내용

**모달 4분기 (에러코드 기반):**

| 에러코드 | 제목 | 핵심 카피 | CTA |
|----------|------|-----------|-----|
| DAILY_LIMIT_EXCEEDED | 오늘 체험 5회 소진 | "지금 업그레이드하면 **바로 이어서 생성**" + 가치문구 | 지금 바로 업그레이드 |
| MONTHLY_LIMIT_EXCEEDED | 이번 달 무료 10회 소진 | "바로 이어서 생성 + 고급 모델(gpt-4o)" + 가치문구 | 지금 바로 업그레이드 |
| INSUFFICIENT_CREDITS (Standard) | 이번 달 300회 소진 | "Pro 월 1,000회 + 브랜드보이스/CSV/A/B" | Pro로 업그레이드 |
| INSUFFICIENT_CREDITS (Pro) | 이번 달 크레딧 소진 | "다음 결제일에 충전" | 플랜 변경 |

**가치 문구 추가:**
- "Standard 월 19,000원 · 하루 약 633원으로 월 300회 + 고급 AI(gpt-4o)"
- CSS class `.generate-modal-value` 추가 (indigo 배경 강조 박스)

**Trial 종료 배너 고도화:**
- "체험 때 느꼈던 고급 AI 품질을 계속 쓰려면 업그레이드하세요"
- "Standard 하루 약 633원 · 월 300회 · gpt-4o"
- CTA: "지금 업그레이드"

---

## 수정된 파일 총 목록 (2차)

| 파일 | 변경 요약 |
|------|-----------|
| `app/api/billing/webhook/route.ts` | invoice.paid 리팩터+로깅, sub.updated에 users.plan 동기화 |
| `supabase/migrations/20260405100000_new_plan_policy.sql` | refund-aware count 쿼리 |
| `app/api/me/route.ts` | refund-aware remaining 계산 |
| `app/api/generations/route.ts` | Free 히스토리 30개 제한 |
| `components/GenerationsList.tsx` | 히스토리 제한 안내 UI |
| `components/GeneratePageClient.tsx` | 업셀 모달 4분기 + 가치문구 + 배너 고도화 |
| `app/(marketing)/landing.css` | .generate-modal-value 스타일 |

---

## 남은 TODO

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| Stripe 대시보드 price 확인 (수동) | 높 | 코드 외 작업 |
| 프리셋 저장 기능 (Standard) | 중 | 신규 기능 개발 필요 |
| 브랜드 보이스 저장 (Pro) | 중 | 신규 기능 개발 필요 |
| CSV Export (Pro) | 중 | 신규 기능 개발 필요 |
| A/B 변형 (Pro) | 중 | 신규 기능 개발 필요 |
| pricing 4칼럼 모바일 반응형 | 낮 | CSS 미디어쿼리 |
| 유료 플랜 count-based 단일화 | 낮 | 장기적 아키텍처 개선 |
