-- Add onboarding fields to public.users
-- nickname, avatar_url, onboarding_completed

begin;

alter table public.users
  add column if not exists nickname text,
  add column if not exists avatar_url text,
  add column if not exists onboarding_completed boolean not null default false;

-- Mark existing users as onboarded (they already have accounts)
update public.users set onboarding_completed = true where onboarding_completed = false;

commit;
