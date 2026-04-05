# VibeCopy 기술 설계서 (Tech Design Doc)

작성일: 2026-02-13 (Asia/Seoul)

## 목적

- 1인 개발자가 **Cursor / Claude Code**로 빠르게 구현할 수 있도록, MVP 개발에 필요한 기술 의사결정을 고정한다.
- “셀러 전용 AI 판매 카피 패키지”를 **웹앱(MVP)** 으로 출시하고, 이후 확장 가능하도록 설계한다.

---

## 1) 기술 스택 결론 (추천)

### 1.1 언어/프레임워크

- **TypeScript**
- **Next.js 14+ (App Router)**

### 1.2 백엔드/DB/Auth

- **Supabase** (Postgres + Auth + RLS)
- DB 마이그레이션: Supabase CLI

### 1.3 AI

- **OpenAI API**
- 모델 교체 대비: AI 호출 레이어 분리(`/lib/ai`)

### 1.4 결제

- 1차 권장: **Stripe** (구독/해지/업그레이드 관리 쉬움)
- 대안: PortOne(포트원) 또는 토스페이먼츠 정기결제

### 1.5 배포

- **Vercel** + Supabase

---

## 2) 시스템 아키텍처 (MVP)

### 2.1 핵심 흐름

1. 로그인(Supabase Auth)
2. 생성 요청 → Next.js API(`/api/generate`)
3. 서버: 입력 검증 → 크레딧 확인/차감 → OpenAI 호출
4. 결과 저장(`generations`) 후 응답 반환
5. 결제/플랜 변경은 Stripe Webhook으로 DB 동기화

### 2.2 컴포넌트

- Web: Next.js (UI + API)
- DB/Auth: Supabase
- AI: OpenAI
- Billing: Stripe

---

## 3) 레포/폴더 구조 (권장)

```
/vibecopy
  /app
    /(marketing)
      page.tsx
      pricing/page.tsx
    /(app)
      dashboard/page.tsx
      generate/page.tsx
      history/page.tsx
      settings/page.tsx
    /api
      generate/route.ts
      billing/webhook/route.ts
      me/route.ts
  /components
    CopyPackageView.tsx
    VibePresetPicker.tsx
    ChannelPicker.tsx
    CreditBadge.tsx
  /lib
    /ai
      openai.ts
      prompts.ts
      safety.ts
    /billing
      stripe.ts
      plans.ts
    /db
      supabaseClient.ts
      queries.ts
    auth.ts
    rateLimit.ts
  /supabase
    migrations/
  .env.example
```

---

## 4) 데이터 모델 (Postgres / Supabase)

### 4.1 테이블

- `profiles`: 사용자 플랜/크레딧/설정
- `generations`: 생성 요청/응답 로그
- `subscriptions`: 구독 상태(Stripe 연동)
- `usage_ledger`: 크레딧 차감/환급 원장(정합성)
- `brand_voices` (Pro): 브랜드 보이스 프리셋

### 4.2 profiles 스키마(요약)

- `id uuid` (PK, auth.users.id)
- `email text`
- `plan_type text` (`free|standard|pro`)
- `credit_balance int`
- `created_at timestamptz`
- `updated_at timestamptz`

### 4.3 generations 스키마(요약)

- `id uuid` (PK)
- `user_id uuid` (FK)
- `channel text` (`smartstore|coupang|groupbuy|shortform`)
- `vibe text` (`trust|review|hype|premium|groupbuy`)
- `input jsonb` (정규화된 입력)
- `output jsonb` (카피 패키지)
- `tokens_prompt int`, `tokens_output int`, `cost_usd numeric`
- `created_at timestamptz`

---

### 4.4 usage_ledger 스키마(요약)

- `id uuid` (PK)
- `user_id uuid`
- `generation_id uuid` (nullable)
- `type text` (`debit|credit`)
- `amount int` (차감/환급 크레딧)
- `reason text` (`generate|refund|admin|plan_reset`)
- `idempotency_key text` (중복 차감 방지)
- `created_at timestamptz`

### 4.5 subscriptions 스키마(요약)

- `id uuid` (PK)
- `user_id uuid`
- `provider text` (`stripe`)
- `customer_id text`
- `subscription_id text`
- `status text` (`active|trialing|past_due|canceled`)
- `current_period_end timestamptz`
- `plan_type text`

### 4.6 DDL 스케치 (Supabase migrations)

> 실제 적용 시는 Supabase CLI로 migration 파일 생성 후 아래를 반영

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan_type text not null default 'free',
  credit_balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- generations
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  vibe text not null,
  input jsonb not null,
  output jsonb,
  tokens_prompt int,
  tokens_output int,
  cost_usd numeric,
  created_at timestamptz not null default now()
);

-- usage ledger
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid references public.generations(id) on delete set null,
  type text not null,
  amount int not null,
  reason text not null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

-- subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text,
  status text,
  current_period_end timestamptz,
  plan_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

bscription_id text`

- `status text` (`active|past_due|canceled|incomplete`)
- `current_period_end timestamptz`
- `plan_type text`
- `created_at timestamptz`

### 4.6 Supabase RLS 원칙

- `profiles`: 본인 행만 읽기/수정
- `generations`: 본인 생성 기록만 조회
- `usage_ledger`: 본인 원장만 조회
- `subscriptions`: 본인 구독만 조회

---

## 5) DB DDL (초안)

> Supabase migrations에 그대로 사용 가능.

```sql
-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan_type text not null default 'free',
  credit_balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- generations
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  channel text not null,
  vibe text not null,
  input jsonb not null,
  output jsonb not null,
  tokens_prompt int,
  tokens_output int,
  cost_usd numeric,
  created_at timestamptz not null default now()
);

-- usage_ledger
create table if not exists usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  generation_id uuid references generations(id) on delete set null,
  type text not null,
  amount int not null,
  reason text not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

-- subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text,
  status text,
  current_period_end timestamptz,
  plan_type text,
  created_at timestamptz not null default now()
);
```

---

## 5) DB DDL (초안)

> Supabase migrations에 그대로 사용 가능.

```sql
-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan_type text not null default 'free',
  credit_balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- generations
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  channel text not null,
  vibe text not null,
  input jsonb not null,
  output jsonb,
  tokens_prompt int,
  tokens_output int,
  cost_usd numeric,
  created_at timestamptz not null default now()
);
```

reate table if not exists generations (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
channel text not null,
vibe text not null,
input jsonb not null,
output jsonb not null,
tokens_prompt int,
tokens_output int,
cost_usd numeric(10,4),
created_at timestamptz not null default now()
);

-- usage_ledger
create table if not exists usage_ledger (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
generation_id uuid references generations(id) on delete set null,
type text not null,
amount int not null,
reason text not null,
idempotency_key text unique,
created_at timestamptz not null default now()
);

-- subscriptions
create table if not exists subscriptions (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
provider text not null default 'stripe',
customer_id text,
subscription_id text,
status text,
current_period_end timestamptz,
plan_type text,
created_at timestamptz not null default now()
);

-- brand_voices (Pro)
create table if not exists brand_voices (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
name text not null,
spec jsonb not null,
created_at timestamptz not null default now()
);

```
te table if not exists usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  generation_id uuid references generations(id) on delete set null,
  type text not null,
  amount int not null,
  reason text not null,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

-- subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text,
  status text not null,
  current_period_end timestamptz,
  plan_type text not null,
  created_at timestamptz not null default now()
);

-- brand_voices (Pro)
create table if not exists brand_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  rules jsonb not null,
  created_at timestamptz not null default now()
);
```

---

ate table if not exists subscriptions (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
provider text not null default 'stripe',
customer_id text,
subscription_id text,
status text,
current_period_end timestamptz,
plan_type text,
created_at timestamptz not null default now()
);

-- brand_voices (Pro)
create table if not exists brand_voices (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
name text not null,
style jsonb not null,
created_at timestamptz not null default now()
);

```

---
ble if not exists brand_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  constraints_json jsonb not null,
  created_at timestamptz not null default now()
);
```

---

## 6) RLS 정책 (필수)

> Supabase에서 RLS 활성화 후 정책을 추가한다.

```sql
alter table profiles enable row level security;
alter table generations enable row level security;
alter table usage_ledger enable row level security;
alter table subscriptions enable row level security;
alter table brand_voices enable row level security;

-- profiles: 본인만
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- generations: 본인만
create policy "generations_select_own" on generations
  for select using (auth.uid() = user_id);
create policy "generations_insert_own" on generations
  for insert with check (auth.uid() = user_id);

-- usage_ledger: 본인만
create policy "ledger_select_own" on usage_ledger
  for select using (auth.uid() = user_id);
create policy "ledger_insert_own" on usage_ledger
  for insert with check (auth.uid() = user_id);

-- subscriptions: 본인만
create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);

-- brand_voices: 본인만
create policy "brandvoices_select_own" on brand_voices
  for select using (auth.uid() = user_id);
create policy "brandvoices_write_own" on brand_voices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

ect using (auth.uid() = id);
create policy "profiles_update_own" on profiles
for update using (auth.uid() = id);

-- generations
create policy "generations_select_own" on generations
for select using (auth.uid() = user_id);
create policy "generations_insert_own" on generations
for insert with check (auth.uid() = user_id);

-- usage_ledger
create policy "usage_select_own" on usage_ledger
for select using (auth.uid() = user_id);
create policy "usage_insert_own" on usage_ledger
for insert with check (auth.uid() = user_id);

-- subscriptions
create policy "subs_select_own" on subscriptions
for select using (auth.uid() = user_id);
create policy "subs_insert_own" on subscriptions
for insert with check (auth.uid() = user_id);
create policy "subs_update_own" on subscriptions
for update using (auth.uid() = user_id);

-- brand_voices
create policy "bv_select_own" on brand_voices
for select using (auth.uid() = user_id);
create policy "bv_write_own" on brand_voices
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

```

---
e_ledger
  for select using (auth.uid() = user_id);
create policy "usage_insert_own" on usage_ledger
  for insert with check (auth.uid() = user_id);

-- subscriptions
create policy "subs_select_own" on subscriptions
  for select using (auth.uid() = user_id);
create policy "subs_insert_own" on subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subs_update_own" on subscriptions
  for update using (auth.uid() = user_id);

-- brand_voices
create policy "brand_select_own" on brand_voices
  for select using (auth.uid() = user_id);
create policy "brand_crud_own" on brand_voices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

on subscriptions
for update using (auth.uid() = user_id);

-- brand_voices
create policy "voices_select_own" on brand_voices
for select using (auth.uid() = user_id);
create policy "voices_insert_own" on brand_voices
for insert with check (auth.uid() = user_id);
create policy "voices_delete_own" on brand_voices
for delete using (auth.uid() = user_id);

````

---
## 7) API 설계 (Next.js Route Handlers)

### 7.1 인증 방식
- 클라이언트는 Supabase Auth로 로그인
- API Route에서는 Supabase 서버 클라이언트로 `auth.getUser()` 확인

### 7.2 엔드포인트 목록
- `POST /api/generate`
  - 카피 패키지 생성
- `GET /api/me`
  - 사용자 플랜/크레딧 조회
- `POST /api/billing/webhook`
  - Stripe webhook 수신 (서명 검증 필수)

---

### 7.3 POST /api/generate
**Request JSON**
```json
{
  "channel": "smartstore",
  "vibe": "trust",
  "source": {
    "type": "url",
    "value": "https://..."
  },
  "product": {
    "name": "",
    "features": ["", ""],
    "target": "30-40대",
    "price": ""
  },
  "brandVoiceId": null,
  "idempotencyKey": "uuid-v4"
}
````

**Response JSON (요약)**

```json
{
  "generationId": "uuid",
  "output": {
    "headlines": ["..."],
    "benefits": ["..."],
    "groupbuyMentions": { "dm": "...", "comment": "...", "story": "..." },
    "shortformScripts": [{ "duration": 15, "script": "..." }],
    "ctas": ["..."],
    "riskWarnings": ["..."],
    "disclaimer": "..."
  },
  "creditsLeft": 123
}
```

**서버 로직(핵심)**

1. 세션 확인
2. 입력 검증 (channel/vibe, url 형태, 금칙어)
3. **크레딧 원장 기반 차감** (idempotencyKey로 중복 방지)
4. OpenAI 호출
5. 결과 저장(generations)
6. 응답 반환

---

e": "trust",
"input": {
"productUrl": "https://...",
"title": "...",
"bullets": ["..."],
"price": "",
"target": "초보 셀러"
},
"brandVoiceId": null,
"idempotencyKey": "uuid-v4"
}

````

**Response JSON**
```json
{
  "generationId": "...",
  "package": {
    "headlines": ["..."],
    "benefits": ["..."],
    "groupbuyMentions": ["..."],
    "shortformScripts": ["..."],
    "ctas": ["..."],
    "riskFlags": ["..."],
    "meta": {"channel": "smartstore", "vibe": "trust"}
  },
  "credits": {"before": 97, "after": 96}
}
````

**서버 처리 순서(중요)**

1. auth 확인
2. 입력 검증(zod)
3. 중복 방지: `idempotencyKey`로 이미 처리된 요청인지 확인
4. 크레딧 차감(트랜잭션)
5. OpenAI 호출
6. 결과 저장 + 응답
7. 실패 시: 차감 원복(원장 `credit` 추가) 또는 실패 상태 기록

---

uyMentions": {
"dm": ["..."],
"comment": ["..."],
"story": ["..."]
},
"shortformScripts": ["..."],
"cta": ["..."],
"riskCheck": {
"flags": ["..."]
}
},
"credits": {
"spent": 1,
"remaining": 12
}
}

````

**서버 처리 규칙**
- `idempotencyKey`로 중복 요청 차감 방지 (`usage_ledger.idempotency_key` UNIQUE)
- 입력 검증 실패 → 400
- 크레딧 부족 → 402 또는 429(정책에 따라)
- OpenAI 오류 → 차감 롤백(원장 credit 기록) 또는 차감 전 호출(권장: 차감 전 lock+차감, 실패 시 환급)

---
## 8) 크레딧/요금제 정책 (MVP 기준)

### 8.1 크레딧 차감 단위
- MVP: **1회 생성 = 1 크레딧**
- Free (체험 7일): 일 3회, 프리미엄 AI (gpt-4o) / 체험 종료 후: 일 1회, 기본 AI (gpt-4o-mini)
- Standard: 월 100크레딧
- Pro: 무제한(실제 구현은 큰 크레딧 + 레이트리밋)

### 8.2 월 리셋 로직
- Stripe Webhook에서 결제 성공 시점에 `credit_balance`를 플랜별 기본값으로 리셋
- Pro는 리셋 대신 레이트리밋으로 비용 통제

### 8.3 중복 차감 방지(필수)
- 모든 생성 요청은 `idempotencyKey`(uuid) 필수
- `usage_ledger.idempotency_key`를 UNIQUE로 두고, 중복이면 기존 결과 반환(선택) 또는 409

---
) 또는 409 반환

---

## 9) AI 생성 파이프라인

### 9.1 입력 정규화
- 입력 소스:
  - `productUrl`(선택) + `title` + `bullets[]`
- URL은 MVP에서 **크롤링 금지**. 사용자가 직접 핵심 정보 입력하도록 UX 설계.
  - (선택) URL 메타태그(og:title 등) 정도만 서버에서 fetch → 실패해도 무시

### 9.2 프롬프트 구조
- System: “셀러 카피라이팅 전문가” + 채널/바이브 룰 + 금칙어 규칙
- User: 상품정보 + 채널 + 바이브 + 출력 JSON 스키마
- Output: **항상 JSON**으로만 반환(파싱 안정성)

### 9.3 출력 JSON 스키마(강제)
```json
{
  "headlines": [""],
  "benefits": [""],
  "groupbuyMentions": {"dm": [""], "comment": [""], "story": [""…]}
}
````

> 실제 구현에서는 `zod`로 스키마 검증 후 실패 시 재시도(최대 1회) 권장

### 9.4 안전/리스크 필터

- 금칙어/민감표현 필터 레이어(`/lib/ai/safety.ts`)
  - 건강/의약 효능 단정, 최저가/1위 단정, 과장 표현 등 “리스크 플래그”를 함께 반환
- 결과는 수정하지 말고 `riskCheck.flags[]`로 경고만 표시 (CS 감소)

### 9.5 모델/비용

- MVP는 1개 모델로 고정하고, 추후 `plans.ts`로 플랜별 모델 분기
- 비용 컬럼(`cost_usd`) 저장하여 단위경제 추적

---

"headlines": ["string"],
"benefits": ["string"],
"groupbuyMentions": {
"dm": ["string"],
"comment": ["string"],
"story": ["string"]
},
"shortformScripts": ["string"],
"cta": ["string"],
"riskCheck": {
"flags": ["string"],
"safeCopy": ["string"]
}
}

````

### 9.4 금칙어/리스크 체크
- 카테고리/표현에 따라 위험 문구가 생길 수 있으므로 2단계로 처리
  1) 생성 단계에서 금칙어 회피
  2) 후처리에서 키워드 룰 기반 `flags` 생성

예시 룰(간단)
- 의약/치료 암시: "치료", "완치", "병", "약" 등 → flag
- 과장/최상급: "100%", "무조건", "최고" → flag

### 9.5 레이트 리밋(비용/악용 방지)
- IP+user_id 기준 분당 요청 제한
- Free는 더 강하게 제한

---
## 10) Stripe 결제 설계

### 10.1 권장 플로우
- Pricing → Checkout Session 생성(서버)
- Checkout 완료 Redirect
- Webhook 수신으로 DB 확정(서명 검증)

### 10.2 Webhook 최소 이벤트
- `checkout.session.completed`: customer_id 저장
- `customer.subscription.created|updated|deleted`: 상태/플랜 동기화
- `invoice.paid`: 결제 성공 시 크레딧 리셋(standard)

### 10.3 플랜 매핑
- Stripe Price ID ↔ 내부 `plan_type` 매핑 테이블(`/lib/billing/plans.ts`)

---
## 11) 인증/보안/레이트리밋

### 11.1 인증
- Supabase Auth (email+magic link 또는 OAuth)
- API에서는 서버 클라이언트로 사용자 확인

### 11.2 레이트리밋
- IP+user_id 기준
- 예시: free는 분당 3회, standard는 분당 10회, pro는 분당 30회
- 구현: Upstash Redis 또는 간단히 Supabase 테이블 기반(초기)

### 11.3 비밀키
- OpenAI/Stripe Secret은 Vercel Env에 저장
- Webhook 엔드포인트는 Stripe Signature 검증 필수

---
## 12) 핵심 구현 스케치

### 12.1 /api/generate 의사코드
```ts
// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { debitCredits, refundCredits } from "@/lib/db/queries";
import { buildPrompt } from "@/lib/ai/prompts";
import { callOpenAIJson } from "@/lib/ai/openai";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  // validate body.channel, body.vibe, body.input, body.idempotencyKey

  // 1) idempotency: 이미 원장 존재하면 기존 결과 반환(선택)

  // 2) credit debit (atomic)
  const debit = await debitCredits({ userId: user.id, amount: 1, idempotencyKey: body.idempotencyKey });
  if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 402 });

  try {
    const prompt = buildPrompt({ ...body });
    const aiJson = await callOpenAIJson(prompt);

    // 3) save generation
    // insert generations (output json)

    return NextResponse.json({ package: aiJson, credits: debit.credits });
  } catch (e) {
    await refundCredits({ userId: user.id, amount: 1, idempotencyKey: body.idempotencyKey });
    return NextResponse.json({ error: "ai_failed" }, { status: 500 });
  }
}
````

### 12.2 크레딧 차감(원장 기반) 원칙

- 차감은 반드시 **원장(usage_ledger)** 으로 기록
- `profiles.credit_balance`는 캐시 성격(조회 빠르게)
- DB 트랜잭션으로 `usage_ledger insert` + `profiles update`를 원자 처리

---

if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

const body = await req.json();
validate(body);

// 1) 크레딧 차감(원장 + balance)
const debit = await debitCredits({
userId: user.id,
amount: 1,
idempotencyKey: body.idempotencyKey,
reason: "generate"
});

try {
const prompt = buildPrompt(body);
const output = await callOpenAIJson(prompt);

    // 2) generations 저장
    const gen = await saveGeneration({ userId: user.id, body, output });

    return NextResponse.json({ generationId: gen.id, package: output, credits: debit });

} catch (e) {
await refundCredits({ userId: user.id, amount: 1, idempotencyKey: body.idempotencyKey, reason: "refund" });
throw e;
}
}

```

### 12.2 debitCredits 핵심 규칙
- `usage_ledger.idempotency_key` UNIQUE
- 중복 key이면 이미 차감된 것으로 보고 기존 결과를 반환하거나 409

---
nAIJson(prompt);

    const generationId = await saveGeneration({ userId: user.id, body, output });
    return NextResponse.json({ generationId, package: output, credits: debit.credits });
  } catch (e) {
    await refundCredits({ userId: user.id, idempotencyKey: body.idempotencyKey, reason: "refund" });
    return NextResponse.json({ error: "ai_failed" }, { status: 500 });
  }
}
```

### 12.2 AI 호출 레이어(요약)

- `callOpenAIJson()`는 **JSON-only** 응답 강제
- 파싱 실패시 1회 재시도(같은 프롬프트 + “JSON만” 강조)

---

### 12.2 Stripe Webhook 의사코드

```ts
// app/api/billing/webhook/route.ts
import Stripe from "stripe";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "invoice.paid":
      // plan_type 확인 후 크레딧 리셋
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // subscriptions 테이블 동기화
      break;
  }
  return new Response("ok", { status: 200 });
}
```

---

## 13) 환경변수(.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STANDARD=
STRIPE_PRICE_PRO=
```

---

## 14) 로컬 개발/배포

### 14.1 로컬 개발

- Node 20 LTS 권장
- `pnpm` 권장
- Supabase CLI:
  - `supabase start`
  - `supabase db reset`

### 14.2 배포

- Vercel에 연결 → Env 설정 → Deploy
- Stripe Webhook endpoint를 Vercel URL로 등록
- Supabase RLS/정책 적용 확인

---

## 15) 운영/CS 최소화 설계

- 출력 결과에 “사용 팁”을 함께 제공(버튼 1개: 복사/내보내기)
- 에러 메시지 표준화 (401/402/500)
- FAQ 자동 링크: 생성 실패/크레딧/결제/금칙어

---

## 16) 확장 로드맵(설계 기반)

- 크롬 익스텐션: 로그인 토큰 기반으로 `/api/generate` 호출
- 대시보드: `generations` 집계로 CTR/성과 입력형(셀러가 수동 입력)부터
- 니치 특화: 카테고리별 프롬프트/금칙어 룰 세트 분리
- 해외 확장: 언어/채널 템플릿만 교체

---

## 부록 A) Cursor/Claude Code용 작업 단위(추천)

- Task 1: Supabase 프로젝트 생성 + RLS/DDL 적용
- Task 2: Next.js 로그인/세션 + `GET /api/me`
- Task 3: Generate UI + `POST /api/generate` (고정 프롬프트)
- Task 4: Stripe Checkout + Webhook + 플랜 동기화
- Task 5: 히스토리 화면 + 복사 UX + 레이트리밋
  await resetCreditsForPlan(...);
  break;
  case "customer.subscription.updated":
  await syncSubscription(...);
  break;
  }
  return new Response("ok");
  }

````

---

## 13) 환경변수(.env.example)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STANDARD=
STRIPE_PRICE_PRO=
````

---

## 14) 배포/운영 체크리스트

- Supabase: migration 적용, RLS 활성화, Auth 설정
- Vercel: env 설정 후 배포
- Stripe: 가격/상품 생성, webhook 등록
- 비용 모니터링: OpenAI 사용량/에러율 확인

---

## 15) 확장 설계 포인트

- 크롬 익스텐션: 로그인 토큰 기반으로 `/api/generate` 호출, 페이지 텍스트를 사용자 동의 하에 입력으로 사용
- 니치 특화: 카테고리별 프롬프트/금칙어 룰 세분화
- 성과 기반: "잘 팔린 카피" 템플릿 저장 및 추천(데이터 축적)

---

## 16) MVP 구현 순서(추천)

1. Supabase 프로젝트/테이블/RLS
2. Next.js Auth 연동 + `/api/me`
3. `/api/generate` + 프롬프트/JSON 파싱
4. 히스토리 페이지(Generations 리스트)
5. Stripe Checkout + Webhook
6. 레이트리밋/금칙어 룰 보강
   D=
   STRIPE_PRICE_PRO=
   APP_URL=http://localhost:3000

```

---

## 14) 로컬 개발/배포 절차

### 14.1 로컬
1) `pnpm i`
2) Supabase 프로젝트 생성 후 `.env` 세팅
3) `supabase start` (로컬) 또는 원격 프로젝트 사용
4) `supabase db push`로 migrations 적용
5) `pnpm dev`

### 14.2 Vercel 배포
1) GitHub 연결
2) Vercel Env 설정
3) 배포
4) Stripe webhook URL 등록(프로덕션 도메인)

---

## 15) MVP 이후 확장 포인트 (설계 반영)
- 크롬 익스텐션: 입력 자동 채우기/복사 버튼 등 UX 강화
- 니치 특화 템플릿: 카테고리별 바이브 프리셋
- 성과 데이터: 사용자가 CTR/전환을 입력하면 “잘 팔린 카피 패턴” 학습
- 팀 기능: Pro에서 팀 멤버/브랜드 보이스 공유

---

## 16) 1인 개발자가 CS를 줄이는 설계 원칙
- 출력 JSON 고정 → 결과/버그 재현이 쉬움
- 실패 시 자동 환급 → 불만/CS 감소
- FAQ/튜토리얼(영상 2개)로 온보딩
- 금칙어 플래그 + 안전문구 추천 → 플랫폼 정책 이슈 감소

---

### 체크리스트 (MVP 완료 기준)
- [ ] Supabase Auth 로그인 동작
- [ ] 크레딧 차감/환급 원장 정합성
- [ ] /api/generate JSON 출력 파싱 100% 성공
- [ ] Stripe 결제 → webhook → 플랜/크레딧 동기화
- [ ] RLS 정책으로 사용자 데이터 분리 확인
- 니치 특화: 카테고리별 프롬프트/룰셋(예: 건강식품, 뷰티)
- 성과 추적: UTM 템플릿/캠페인 링크 생성 → 사용자가 결과를 넣으면 학습 데이터 축적
- 팀 기능(Pro): 브랜드 보이스 공유/권한

---

## 16) 1인 개발자 운영 체크리스트 (CS 최소화)
- FAQ/가이드: “입력 예시”, “금칙어”, “환불/크레딧 정책” 문서화
- 에러 메시지: 사용자에게 actionable 하게
- 장애 대응: OpenAI 오류 시 자동 환급 + 상태 공지
- 비용: 토큰/요청 수 대시보드(간단히 DB 집계)

---

## 17) 구현 우선순위 (MVP 2~3주)
1) Auth + `profiles` 자동 생성
2) `/generate` UI + `/api/generate` + 저장/히스토리
3) 크레딧/레이트리밋
4) Stripe Checkout + Webhook + 플랜 반영

끝.
3) 크레딧 차감/환급(원장)
4) Pricing + Checkout
5) Stripe Webhook 동기화
6) History 화면

끝.
```
