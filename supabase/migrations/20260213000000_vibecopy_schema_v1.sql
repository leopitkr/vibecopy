-- VibeCopy DB Schema v1
-- Run in Supabase SQL Editor (or via Supabase CLI: supabase db push)

begin;

-- 1) enums (optional but recommended)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type plan_type as enum ('free', 'standard', 'pro');
  end if;

  if not exists (select 1 from pg_type where typname = 'channel_type') then
    create type channel_type as enum ('smartstore', 'coupang', 'affiliate', 'social', 'shortform');
  end if;

  if not exists (select 1 from pg_type where typname = 'vibe_type') then
    create type vibe_type as enum ('trust', 'review', 'impulse', 'premium', 'groupbuy');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid');
  end if;
end $$;


-- 2) public.users (app profile / plan / credits)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan plan_type not null default 'free',
  credit_balance integer not null default 0,
  -- for free plan daily limit usage tracking (simple MVP)
  daily_free_used integer not null default 0,
  daily_free_used_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();


-- 3) public.generations (AI generation logs)
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  channel channel_type not null,
  vibe vibe_type not null,

  -- user inputs (store minimal, avoid storing sensitive info if any)
  input_type text not null check (input_type in ('url', 'text')),
  input_value text not null,

  -- structured output contract (JSON)
  output_json jsonb not null,

  -- cost/ops metadata (optional, fill later)
  model text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  latency_ms integer,

  created_at timestamptz not null default now()
);

create index if not exists idx_generations_user_created on public.generations(user_id, created_at desc);
create index if not exists idx_generations_channel on public.generations(channel);
create index if not exists idx_generations_vibe on public.generations(vibe);


-- 4) public.subscriptions (billing state)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  provider text not null default 'stripe',
  status subscription_status not null default 'incomplete',
  plan plan_type not null default 'free',

  -- Stripe identifiers (nullable for non-stripe later)
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (stripe_subscription_id)
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);


-- 5) RLS enable
alter table public.users enable row level security;
alter table public.generations enable row level security;
alter table public.subscriptions enable row level security;


-- 6) RLS policies
-- users: only the owner can select/update their row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
for update using (auth.uid() = id);

-- users: insert is handled via trigger (recommended) or server-side using service role
-- but for MVP we allow user to insert their own profile once (optional).
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
for insert with check (auth.uid() = id);

-- generations: owner can CRUD
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
for select using (auth.uid() = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own" on public.generations
for insert with check (auth.uid() = user_id);

drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_delete_own" on public.generations
for delete using (auth.uid() = user_id);

-- (Update is not required for MVP; generations are immutable logs)
-- If needed later:
drop policy if exists "generations_update_own" on public.generations;
create policy "generations_update_own" on public.generations
for update using (auth.uid() = user_id);

-- subscriptions: owner can select; insert/update typically server-side via webhook
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
for select using (auth.uid() = user_id);

-- disable client-side insert/update by default for subscriptions (safer)
-- (no insert/update policies created) -> only service role can write

commit;
