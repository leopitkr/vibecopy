-- Restore free plan daily limit from 50 (test) back to 3 (production)
-- This reverts the temporary increase from 20260213190000_temp_increase_daily_limit.sql

drop function if exists public.debit_credits(uuid, int, text, text);

create function public.debit_credits(
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
  v_display_before int;
  v_display_after int;
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

  select u.credit_balance, plan::text into v_balance, v_plan from public.users u where u.id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  select id into v_ledger_id from public.usage_ledger
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    if v_plan = 'free' then
      select count(*) into v_today_debits from public.usage_ledger
      where user_id = p_user_id and type = 'debit' and reason = 'generate'
        and created_at::date = current_date;
      v_display_before := greatest(0, 3 - v_today_debits);
      return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_display_before, 'after', v_display_before);
    end if;
    return jsonb_build_object('ok', true, 'duplicated', true, 'before', v_balance, 'after', v_balance);
  end if;

  -- Free plan: daily limit 3 (restored from temporary 50)
  if v_plan = 'free' then
    select count(*) into v_today_debits from public.usage_ledger
    where user_id = p_user_id and type = 'debit' and reason = 'generate'
      and created_at::date = current_date;
    if v_today_debits >= 3 then
      return jsonb_build_object('ok', false, 'error', 'DAILY_LIMIT_EXCEEDED');
    end if;
    v_display_before := 3 - v_today_debits;
    v_display_after := greatest(0, v_display_before - p_amount);
    insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
    values (p_user_id, null, 'debit', p_amount, p_reason, p_idempotency_key);
    return jsonb_build_object('ok', true, 'before', v_display_before, 'after', v_display_after);
  end if;

  -- Paid plan: require balance and deduct
  if v_balance < p_amount then
    return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS');
  end if;
  insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
  values (p_user_id, null, 'debit', p_amount, p_reason, p_idempotency_key);
  update public.users
  set credit_balance = credit_balance - p_amount, updated_at = now()
  where id = p_user_id;
  return jsonb_build_object('ok', true, 'before', v_balance, 'after', v_balance - p_amount);
end;
$$;
