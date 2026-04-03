# Plan: Social Login + Phase 2 전환 구조 개선

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | 소셜 로그인 + 플랜 구조 개선 + 7일 체험 |
| 시작일 | 2026-04-03 |
| 범위 | Phase 2 전체 (2-1, 2-2, 2-3) |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | 이메일+비번 가입 마찰로 전환율 저하, 무료 3회/일로 결제 동기 없음 |
| Solution | 카카오/구글 소셜 로그인 + 무료 1회/일 축소 + 유료=gpt-4o 차별화 + 7일 체험 |
| Function UX Effect | 원클릭 소셜 로그인, 유료 사용자 체감 품질 향상 |
| Core Value | 가입 전환율 2~3배 향상, 유료 전환 동기 확보 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 합성 사용자 테스트에서 0/5 결제 의향. 가입 마찰 + 결제 동기 부재가 핵심 병목 |
| WHO | 한국 셀러 (스마트스토어, 쿠팡, 공구, 숏폼) |
| RISK | Supabase에 Naver OAuth 미지원 → Google로 대체. 무료 축소 시 기존 사용자 반발 |
| SUCCESS | 가입 전환율 향상, 유료 전환율 5%+ |
| SCOPE | 인증 UI, 플랜 상수, 모델 분기, 프라이싱 페이지, 7일 체험 |

## 1. Requirements

### 2-1. 무료 플랜 축소 + 품질 차별화

| 플랜 | 횟수 | 모델 | 비용 |
|------|------|------|------|
| Guest | 1회/일 | gpt-4o-mini | 0원 |
| Free | 1회/일 | gpt-4o-mini | 0원 |
| Standard | 100회/월 | gpt-4o | 19,000원/월 |
| Pro | 무제한 | gpt-4o | 49,000원/월 |

변경점:
- `PLAN_LIMITS.free.dailyLimit`: 3 → 1
- `PLAN_LIMITS.standard.monthlyCredits`: 500 → 100
- 모델 선택: plan이 standard/pro이면 gpt-4o, 아니면 gpt-4o-mini
- Pricing 페이지 UI 업데이트

### 2-2. 소셜 로그인 (카카오 + 구글)

- Supabase Auth에 Kakao, Google OAuth 추가
- Login/Signup 페이지에 소셜 로그인 버튼 추가
- Naver는 Supabase 미지원으로 보류 (커스텀 OIDC는 복잡도 대비 효과 낮음)
- 기존 이메일+비번 유지 (소셜 로그인은 추가 옵션)
- 소셜 로그인 시 기존 `handle_new_auth_user` 트리거로 자동 프로필 생성

### 2-3. 7일 무료 체험

- 신규 가입자에게 7일간 gpt-4o + 3회/일 제공
- `users` 테이블에 `trial_ends_at` 컬럼 추가
- 생성 API에서 trial 기간이면 gpt-4o 모델 사용 + dailyLimit 3회 적용
- 체험 기간 종료 후 자동으로 Free (1회/일, gpt-4o-mini)로 전환

## 2. Implementation Files

| 파일 | 변경 내용 |
|------|-----------|
| `lib/constants/limits.ts` | Free dailyLimit 3→1, Standard 500→100 |
| `lib/openai/client.ts` | 플랜별 모델 선택 함수 추가 |
| `app/api/generate/route.ts` | 플랜별 모델 분기 + trial 체크 |
| `app/pricing/page.tsx` | 플랜 정보 업데이트 (1회/일, 100회/월, gpt-4o 표시) |
| `app/login/page.tsx` | 카카오/구글 소셜 로그인 버튼 |
| `app/signup/page.tsx` | 카카오/구글 소셜 로그인 버튼 |
| `supabase/migrations/` | trial_ends_at 컬럼, 트리거 업데이트 |
| `app/api/me/route.ts` | trial 정보 응답에 포함 |

## 3. Risk & Decisions

- Naver OAuth 보류 → Google로 대체 (Supabase 네이티브 지원)
- Supabase Dashboard에서 Kakao/Google provider 활성화는 수동 작업 필요
- 기존 Free 사용자 3회→1회 변경: 즉시 적용 (신규/기존 구분 없음)
- 7일 체험은 신규 가입자만 (기존 사용자에게는 미적용)
