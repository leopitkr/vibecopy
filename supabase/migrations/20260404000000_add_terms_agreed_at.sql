-- Add terms_agreed_at to track explicit terms acceptance
-- onboarding_completed should only be true when terms are agreed

begin;

alter table public.users
  add column if not exists terms_agreed_at timestamptz;

-- Mark existing onboarded users as having agreed (grandfathered)
update public.users
  set terms_agreed_at = updated_at
  where onboarding_completed = true and terms_agreed_at is null;

commit;
