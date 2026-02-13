-- Server-side error logging for API routes (Phase 5)
-- RLS: select/insert own rows only; no update/delete for normal users.
-- Inserts with user_id null require service role (e.g. webhook signature failure).

begin;

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id) on delete set null,
  route text not null,
  method text not null,
  error_code text null,
  status int null,
  message text null,
  details jsonb null,
  request_id text not null,
  ip text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_error_logs_created_at
  on public.error_logs (created_at desc);

create index if not exists idx_error_logs_user_created
  on public.error_logs (user_id, created_at desc);

create index if not exists idx_error_logs_route_created
  on public.error_logs (route, created_at desc);

alter table public.error_logs enable row level security;

-- Select: own rows only
create policy "error_logs_select_own"
  on public.error_logs for select
  using (auth.uid() = user_id);

-- Insert: only when auth.uid() = user_id (server client with session).
-- Inserts with user_id null must use service role (bypasses RLS).
create policy "error_logs_insert_own"
  on public.error_logs for insert
  with check (auth.uid() = user_id);

-- No update/delete policies for normal users

commit;
