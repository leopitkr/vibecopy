-- Beta feedback collection (Phase 6)
-- RLS: insert allowed for authenticated users; select own only

begin;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id) on delete set null,
  purpose text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  good text,
  bad text,
  request text,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_created_at on public.feedback (created_at desc);
create index if not exists idx_feedback_user_id on public.feedback (user_id);

alter table public.feedback enable row level security;

-- Insert: authenticated users only (user_id can be set from auth.uid())
create policy "feedback_insert_authenticated"
  on public.feedback for insert
  with check (auth.uid() is not null);

-- Select: own rows only
create policy "feedback_select_own"
  on public.feedback for select
  using (auth.uid() = user_id);

commit;
