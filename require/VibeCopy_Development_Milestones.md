# 🚀 VibeCopy 개발 마일스톤 문서

작성일: 2026-02-13

> **cursor.rule 준수:** 단계 완료 시 해당 체크박스를 `- [x]` 로 표시하고 **같은 줄에** `(commit: <SHORT_HASH>)` 를 반드시 기록. 절차: `pnpm finish` 사용 및 필요 시 `docs/MILESTONE_WORKFLOW.md` 참고.

---

\# 📌 전체
목표 - 4주
내 MVP
출시 - 8주
내 유료
사용자
50명
확보 -
확장
가능한
아키텍처
유지

---

# 🧱 Phase 0: 프로젝트 셋업 (Day 1\~2)

## 환경 구축

- [x] Next.js 프로젝트 생성 (App Router) (commit: bf70ee7)
- [x] TypeScript 설정 확인 (commit: 6d0c5ea)
- [x] TailwindCSS 설정 (commit: 0ba134c)
- [x] ESLint / Prettier 설정  (commit: c2d4771)
- [x] 환경변수(.env.local) 구조 정의  (commit: 8ac8b70)

## 배포 환경

- [ ] Vercel 프로젝트 생성
- [ ] GitHub 레포 생성 및 연결
- [ ] 기본 배포 테스트 성공

---

# 🔐 Phase 1: 인증 & DB 구축 (Day 3\~5)

## Supabase 설정

- [ ] Supabase 프로젝트 생성
- [x] Users 테이블 생성  (commit: 4eb6e09)
- [x] Generations 테이블 생성  (commit: 4eb6e09)
- [x] Subscription 테이블 생성  (commit: 4eb6e09)
- [x] RLS 정책 설정  (commit: 4eb6e09)
- [x] Auth 연동 테스트  (commit: f6f6158)

## 계정 기능

- [ ] 회원가입 페이지
- [ ] 로그인 페이지
- [ ] 로그아웃 기능
- [ ] 세션 유지 처리

---

# 🤖 Phase 2: 핵심 기능 -- 판매카피 패키지 생성 (Day 6\~10)

## API 구현

- [x] /api/generate 라우트 생성  (commit: 587c5f8)
- [ ] OpenAI API 연동
- [x] 프롬프트 템플릿 작성 (바이브 프리셋 포함)  (commit: 88ec0eb)
- [ ] JSON 형태 결과 강제 구조화
- [ ] 에러 핸들링

## 크레딧 시스템

- [x] credit_balance 컬럼 구현  (commit: f18055c)
- [x] 요청 시 크레딧 차감 로직  (commit: f18055c)
- [x] 트랜잭션 처리 (중복 차감 방지)  (commit: f18055c)
- [x] 크레딧 부족 시 차단 처리  (commit: f18055c)
- [x] 크레딧 사용 로그 기록  (commit: f18055c)

## UI 구현

- [x] 입력 폼 (URL/상품설명)  (commit: 65e50e8)
- [x] 채널 선택 UI  (commit: 65e50e8)
- [x] 바이브 선택 UI  (commit: 65e50e8)
- [x] 결과 출력 레이아웃 구성  (commit: 65e50e8)
- [x] 복사 버튼 기능  (commit: 65e50e8)
- [x] 로딩 상태 표시  (commit: 65e50e8)

---

# 💳 Phase 3: 결제 및 구독 시스템 (Day 11\~14)

## Stripe 연동

- [x] Stripe 계정 생성  (commit: c5d14e2)
- [x] 요금제 생성 (Free / Standard / Pro)  (commit: c5d14e2)
- [x] Checkout 세션 구현  (commit: c5d14e2)
- [x] Webhook 엔드포인트 구현  (commit: c5d14e2)
- [x] 구독 상태 DB 동기화  (commit: c5d14e2)

## 플랜 제한 적용

- [ ] Free 일일 3회 제한
- [ ] Standard 월 500 크레딧
- [ ] Pro 무제한 또는 고크레딧 설정
- [ ] 플랜 변경 시 크레딧 재계산

---

# 📊 Phase 4: 기록/대시보드 기능 (Week 3)

- [x] 생성 기록 조회 페이지  (commit: f89edcb)
- [x] 날짜순 정렬  (commit: f89edcb)
- [x] 재생성 버튼  (commit: f89edcb)
- [x] 사용자 플랜 표시  (commit: f89edcb)
- [x] 크레딧 잔액 표시  (commit: f89edcb)
- [x] 사용량 통계 표시  (commit: f89edcb)

---

# 🛡 Phase 5: 안정화 & 최적화 (Week 4)

## 비용 통제

- [x] OpenAI 토큰 제한 설정  (commit: 34ae8d2)
- [x] 최대 입력 글자 수 제한  (commit: 34ae8d2)
- [x] 응답 캐싱 전략 적용  (commit: 34ae8d2)

## 보안

- [x] API rate limiting  (commit: e6bd38b)
- [x] 환경변수 보안 점검  (commit: 448eaf5)
- [x] 에러 로깅 시스템 추가  (commit: f1c4e30)

## UX 개선

- [ ] 생성 중 상태 표시
- [ ] 실패 시 재시도 버튼
- [ ] 성공 피드백 메시지

---

# 🚀 Phase 6: 베타 출시 준비

- [x] 랜딩 페이지 제작  (commit: afe7b35)
- [ ] 이용 가이드 작성
- [ ] FAQ 문서 작성
- [x] 피드백 수집 폼 연결  (commit: 6cda69d)
- [ ] 커뮤니티 베타 모집

---

# 🔮 Phase 7: 확장 로드맵 (MVP 이후)

- [ ] 브랜드 보이스 저장 기능
- [ ] CSV 다운로드
- [ ] A/B 카피 자동 변형 기능
- [ ] 카테고리 특화 모델 개발
- [ ] 크롬 익스텐션 MVP

---

# 📈 KPI 체크리스트

- [ ] 가입자 1,000명 확보
- [ ] 활성화율 40% 달성
- [ ] 유료 전환율 5% 이상
- [ ] 유료 사용자 50명 확보
- [ ] 월 매출 300만원 달성

---

# ✅ 최종 목표

> 3개월 내 월 500만원 → 12개월 내 월 2,000만원 확장
