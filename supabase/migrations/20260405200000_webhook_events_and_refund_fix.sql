-- 1) webhook_events: idempotency table to prevent duplicate Stripe webhook processing
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_stripe_id on public.webhook_events(stripe_event_id);

-- Service role only (webhooks run with service role)
alter table public.webhook_events enable row level security;

-- 2) Fix refund_credits: free/trial users should NOT increment credit_balance
--    (their enforcement is count-based, not balance-based)
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
  v_plan text;
  v_exists boolean;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'BAD_REQUEST');
  end if;

  select credit_balance, plan::text into v_before, v_plan
  from public.users where id = p_user_id for update;
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

  -- Always insert refund ledger entry (for count-based tracking)
  insert into public.usage_ledger (user_id, generation_id, type, amount, reason, idempotency_key)
  values (p_user_id, null, 'credit', p_amount, 'refund', v_refund_key);

  -- Only adjust credit_balance for paid plans (standard/pro)
  -- Free/trial users are count-based; their debit didn't decrement balance
  if v_plan in ('standard', 'pro') then
    update public.users
    set credit_balance = credit_balance + p_amount, updated_at = now()
    where id = p_user_id;

    return jsonb_build_object(
      'ok', true,
      'before', v_before,
      'after', v_before + p_amount
    );
  end if;

  -- Free/trial: ledger entry suffices (count-based enforcement sees the refund)
  return jsonb_build_object(
    'ok', true,
    'before', v_before,
    'after', v_before
  );
end;
$$;
