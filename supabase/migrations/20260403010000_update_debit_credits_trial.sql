-- Update debit_credits to support trial period and new free plan limit (1/day).
-- Trial users (free plan + trial_ends_at > now()) get 3/day.
-- Regular free users get 1/day.

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
    return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_balance, 'after', v_balance);
  end if;

  -- Free plan: daily limit check
  -- Trial users (free + trial_ends_at in future): 3/day
  -- Regular free users: 1/day
  if v_plan = 'free' then
    if v_trial_ends_at is not null and v_trial_ends_at > now() then
      v_daily_limit := 3;
    else
      v_daily_limit := 1;
    end if;

    select count(*) into v_today_debits from public.usage_ledger
    where user_id = p_user_id and type = 'debit' and reason = 'generate'
      and created_at::date = current_date;
    if v_today_debits >= v_daily_limit then
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
