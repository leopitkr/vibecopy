# 3단계 결과: 구독 이력 + 구독 취소

## 완료 항목 (1단계에서 통합 구현)

### API: `GET /api/account/subscriptions` (`app/api/account/subscriptions/route.ts`)
- `public.subscriptions` 테이블에서 사용자 구독 이력 조회
- 최신순 정렬
- RLS 정책으로 본인 데이터만 접근

### API: `POST /api/account/subscriptions/cancel` (`app/api/account/subscriptions/cancel/route.ts`)
- 구독 소유권 검증
- 상태 확인 (active/trialing만 취소 가능)
- `cancel_at_period_end` 플래그 true로 설정
- **TODO**: Stripe 연동 시 `stripe.subscriptions.update()` 호출 추가 필요

### UI: 구독 관리 탭
- **무료 플랜**: 빈 상태 UI + 요금제 업그레이드 버튼
- **유료 플랜**: 현재 플랜 배지 표시
- **구독 이력 목록**: 플랜명, 기간, 상태 배지 표시
- **구독 취소 버튼**: active 상태만 표시, 취소 후 "해지 예정" 상태로 변경
- 상태별 컬러: 활성(초록), 취소(빨강), 지연(노랑)

## 결제 연동 관련
- 현재는 DB 플래그만 업데이트
- Stripe 연동 시 cancel API에서 Stripe API 호출 로직 추가 필요
- subscriptions 테이블에 데이터가 없으면 빈 상태 UI 표시

## 빌드 상태
- ✅ `next build` 성공
