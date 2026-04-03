-- Add trial_ends_at column for 7-day free trial
-- New signups get 7 days of premium AI (gpt-4o) + 3 daily uses

alter table public.users
  add column if not exists trial_ends_at timestamptz default null;

-- Update the auth trigger to set trial_ends_at on signup
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, trial_ends_at)
  values (new.id, new.email, now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on column public.users.trial_ends_at is 'End of 7-day free trial period. During trial, user gets gpt-4o model + 3 daily uses.';
