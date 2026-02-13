-- Rate limiting: per-user + per-IP sliding window for POST /api/generate
-- RLS: select/insert own rows only; no public access

begin;

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_user_created
  on public.rate_limits (user_id, created_at desc);

alter table public.rate_limits enable row level security;

-- Select: own rows only (for sliding-window count in app)
create policy "rate_limits_select_own"
  on public.rate_limits for select
  using (auth.uid() = user_id);

-- Insert: own user_id only (app inserts on each allowed request)
create policy "rate_limits_insert_own"
  on public.rate_limits for insert
  with check (auth.uid() = user_id);

-- No update/delete policies: no public access to mutate

commit;
