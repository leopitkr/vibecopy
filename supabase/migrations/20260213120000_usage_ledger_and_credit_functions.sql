-- usage_ledger: source of truth for credit debits/credits (tech_design_vibecopy.md §4.4, §8.3).
-- unique(user_id, idempotency_key) prevents double charge; refund uses idempotency_key 'refund:'||original_key.

begin;

-- 1) usage_ledger table
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  generation_id uuid references public.generations(id) on delete set null,
  type text not null check (type in ('debit', 'credit')),
  amount int not null check (amount > 0),
  reason text not null check (reason in ('generate', 'refund', 'plan_reset', 'admin')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists idx_usage_ledger_user_created on public.usage_ledger(user_id, created_at desc);
create index if not exists idx_usage_ledger_user_type_reason on public.usage_ledger(user_id, type, reason);

alter table public.usage_ledger enable row level security;

drop policy if exists "usage_ledger_select_own" on public.usage_ledger;
create policy "usage_ledger_select_own" on public.usage_ledger
  for select using (auth.uid() = user_id);

drop policy if exists "usage_ledger_insert_own" on public.usage_ledger;
create policy "usage_ledger_insert_own" on public.usage_ledger
  for insert with check (auth.uid() = user_id);

drop policy if exists "usage_ledger_update_own" on public.usage_ledger;
create policy "usage_ledger_update_own" on public.usage_ledger
  for update using (auth.uid() = user_id);

-- 2) debit_credits: atomic debit with idempotency and free-plan daily limit (VibeCopy_PRD §3.3 Free: 3/day).
-- Caller must be authenticated and auth.uid() = p_user_id. Returns jsonb.
create or replace function public.debit_credits(
  p_user_id uuid,
  p_amount int,
  p_idempotency_key text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_plan text;
  v_today_debits int;
  v_ledger_id uuid;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;
  if p_reason not in ('generate', 'plan_reset', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  -- Idempotency: already have a row for this key?
  select u.credit_balance into v_balance from public.users u where u.id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  select id into v_ledger_id from public.usage_ledger
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_balance, 'after', v_balance);
  end if;

  -- Free plan: daily limit 3 generations (PRD: Free = 3/day)
  select plan::text into v_plan from public.users where id = p_user_id;
  if v_plan = 'free' then
    select count(*) into v_today_debits from public.usage_ledger
    where user_id = p_user_id and type = 'debit' and reason = 'generate'
      and created_at::date = current_date;
    if v_today_debits >= 3 then
      return jsonb_build_object('ok', false, 'error', 'DAILY_LIMIT_EXCEEDED');
    end if;
  end if;

  if v_balance < p_amount then
    return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS');
  end if;

  insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
  values (p_user_id, null, 'debit', p_amount, p_reason, p_idempotency_key);

  update public.users
  set credit_balance = credit_balance - p_amount, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'before', v_balance,
    'after', v_balance - p_amount
  );
end;
$$;

-- 3) refund_credits: atomic credit; idempotency via idempotency_key = 'refund:'||p_original_idempotency_key.
create or replace function public.refund_credits(
  p_user_id uuid,
  p_amount int,
  p_original_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund_key text := 'refund:' || p_original_idempotency_key;
  v_before int;
  v_exists boolean;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  select credit_balance into v_before from public.users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  select exists(
    select 1 from public.usage_ledger
    where user_id = p_user_id and idempotency_key = v_refund_key
  ) into v_exists;
  if v_exists then
    return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_before, 'after', v_before);
  end if;

  insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
  values (p_user_id, null, 'credit', p_amount, 'refund', v_refund_key);

  update public.users
  set credit_balance = credit_balance + p_amount, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'before', v_before,
    'after', v_before + p_amount
  );
end;
$$;

commit;
