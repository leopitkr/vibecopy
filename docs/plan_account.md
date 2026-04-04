# 계정 관리 기능 구현 계획

## 개요
우측 상단 헤더에 "내 정보" 드롭다운 메뉴를 추가하고, 계정 관리 페이지를 구현한다.
기존 디자인 시스템(dark theme, indigo/cyan 컬러, landing.css)을 그대로 따른다.

## 기능 목록
1. **내 정보 드롭다운 메뉴** - 헤더 우측 상단
2. **회원정보 수정** - 닉네임 변경
3. **구독 이력** - subscriptions 테이블 조회 (결제 연동 전이므로 빈 상태 UI 포함)
4. **구독 취소** - cancel_at_period_end 플래그 설정 (결제 연동 후 실제 동작)
5. **회원 탈퇴** - Supabase auth.users 삭제 (cascade로 관련 데이터 자동 삭제)

## 기술 스택
- **DB**: Supabase PostgreSQL (public.users, public.subscriptions)
- **Auth**: Supabase Auth
- **UI**: Next.js App Router + landing.css 스타일 시스템
- **결제**: Stripe (추후 연동 예정, 현재는 UI/API 껍데기만)

## 단계별 구현

### 1단계: UI 구조 (드롭다운 메뉴 + 계정 설정 페이지 레이아웃)
- AuthHeader.tsx에 드롭다운 메뉴 컴포넌트 추가
  - 메뉴 항목: 내 정보, 구독 관리, 로그아웃
- /account 페이지 생성 (탭 기반: 프로필 / 구독 / 계정)
- landing.css에 드롭다운 및 계정 페이지 스타일 추가
- 결과: docs/account_result_1.md

### 2단계: 회원정보 수정 기능
- /api/account/profile API (PATCH - 닉네임 수정)
- 프로필 탭에 닉네임 수정 폼 + 저장 기능
- 결과: docs/account_result_2.md

### 3단계: 구독 이력 + 구독 취소
- /api/account/subscriptions API (GET - 구독 이력 조회)
- /api/account/subscriptions/cancel API (POST - 구독 취소 요청)
- 구독 탭에 이력 목록 + 취소 버튼
- 결제 미연동 상태이므로 빈 상태 UI + 안내 메시지 포함
- 결과: docs/account_result_3.md

### 4단계: 회원 탈퇴
- /api/account/delete API (DELETE - 계정 삭제)
- 계정 탭에 탈퇴 확인 UI (이메일 입력 확인)
- Supabase Admin API로 auth.users 삭제 → cascade 처리
- 결과: docs/account_result_4.md

## DB 스키마 참고
- `public.users`: id, email, nickname, plan, credit_balance, onboarding_completed
- `public.subscriptions`: id, user_id, provider, status, plan, stripe_*, current_period_*, cancel_at_period_end
- auth.users ON DELETE CASCADE → public.users 자동 삭제 → generations, subscriptions 자동 삭제

## 미들웨어 변경
- /account 경로를 PROTECTED_ROUTES에 추가
