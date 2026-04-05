-- New plan policy (2026-04-05):
--   Free (non-trial): 10/month (count-based, no credit_balance dependency)
--   Trial (free + trial_ends_at > now): 5/day
--   Standard: 300/month via credit_balance
--   Pro: 1000/month via credit_balance
--
-- New error code: MONTHLY_LIMIT_EXCEEDED (for free non-trial monthly cap)
-- Timezone: uses date_trunc('month', now() at time zone 'Asia/Seoul') for KST month boundary
-- Refund-aware: count queries exclude debits that have a matching refund entry

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
  v_trial_ends_at timestamptz;
  v_daily_limit int;
  v_monthly_limit int;
  v_effective_debits int;
  v_ledger_id uuid;
  v_period_start timestamptz;
  v_free_limit int;
  v_remaining_before int;
  v_remaining_after int;
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

  -- Lock user row and get balance + plan + trial info
  select u.credit_balance, u.plan::text, u.trial_ends_at
    into v_balance, v_plan, v_trial_ends_at
    from public.users u where u.id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  -- Idempotency check
  select id into v_ledger_id from public.usage_ledger
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    -- For free users, return count-based remaining (consistent with /api/me)
    if v_plan = 'free' then
      if v_trial_ends_at is not null and v_trial_ends_at > now() then
        v_period_start := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
        v_free_limit := 5;
      else
        v_period_start := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
        v_free_limit := 10;
      end if;
      select count(*) into v_effective_debits from public.usage_ledger d
      where d.user_id = p_user_id and d.type = 'debit' and d.reason = 'generate'
        and d.created_at >= v_period_start
        and not exists (
          select 1 from public.usage_ledger r
          where r.user_id = p_user_id and r.type = 'credit'
            and r.idempotency_key = 'refund:' || d.idempotency_key
        );
      v_remaining_after := greatest(0, v_free_limit - v_effective_debits);
      return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_remaining_after, 'after', v_remaining_after);
    end if;
    -- Paid plans: credit_balance is correct
    return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_balance, 'after', v_balance);
  end if;

  -- Free plan limit enforcement
  if v_plan = 'free' then
    if v_trial_ends_at is not null and v_trial_ends_at > now() then
      -- Active trial: 5 generations per day (KST)
      v_daily_limit := 5;
      v_period_start := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
    else
      -- Post-trial free: 10 generations per month (KST)
      v_monthly_limit := 10;
      v_period_start := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
    end if;

    -- Count effective debits (exclude refunded ones)
    select count(*) into v_effective_debits from public.usage_ledger d
    where d.user_id = p_user_id and d.type = 'debit' and d.reason = 'generate'
      and d.created_at >= v_period_start
      and not exists (
        select 1 from public.usage_ledger r
        where r.user_id = p_user_id and r.type = 'credit'
          and r.idempotency_key = 'refund:' || d.idempotency_key
      );

    if v_trial_ends_at is not null and v_trial_ends_at > now() then
      if v_effective_debits >= v_daily_limit then
        return jsonb_build_object('ok', false, 'error', 'DAILY_LIMIT_EXCEEDED');
      end if;
    else
      if v_effective_debits >= v_monthly_limit then
        return jsonb_build_object('ok', false, 'error', 'MONTHLY_LIMIT_EXCEEDED');
      end if;
    end if;

    -- Free plan: skip credit_balance check (count-based enforcement above)
    insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
    values (p_user_id, null, 'debit', p_amount, p_reason, p_idempotency_key);

    -- Return count-based remaining (not credit_balance which is unused for free plan)
    if v_trial_ends_at is not null and v_trial_ends_at > now() then
      v_free_limit := v_daily_limit;
    else
      v_free_limit := v_monthly_limit;
    end if;
    v_remaining_before := greatest(0, v_free_limit - v_effective_debits);
    v_remaining_after  := greatest(0, v_free_limit - v_effective_debits - p_amount);

    return jsonb_build_object(
      'ok', true,
      'before', v_remaining_before,
      'after', v_remaining_after
    );
  end if;

  -- Paid plans (standard, pro): credit_balance based
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
