# Feature: Stripe Billing (Checkout + Webhook + Plan Sync)

## Milestone Items
- Phase 3 / Stripe 연동: Stripe 계정 생성, 요금제 생성 (Free / Standard / Pro), Checkout 세션 구현, Webhook 엔드포인트 구현, 구독 상태 DB 동기화

## Summary
Stripe Checkout (createCheckoutSession with metadata.user_id), POST /api/billing/checkout (plan standard|pro → price ID → redirect URL), POST /api/billing/webhook (raw body + signature verification; checkout.session.completed, invoice.paid, customer.subscription.updated/deleted). DB sync: subscriptions table (service role) and users.plan / users.credit_balance on invoice.paid and subscription.deleted. Pricing page at /pricing with Free / Standard (19,000원) / Pro (49,000원) and upgrade → checkout. cursor.rule checked.

## Files Changed
- lib/billing/stripe.ts
- lib/billing/plans.ts
- lib/supabase/service.ts
- app/api/billing/checkout/route.ts
- app/api/billing/webhook/route.ts
- app/pricing/page.tsx
- .env.example (STRIPE_PRICE_*, APP_URL)
- docs/features/phase3/stripe_billing.md

## How to Test
1. Checkout complete → subscriptions row with stripe_customer_id, stripe_subscription_id, status active.
2. invoice.paid → users.credit_balance = PLAN_CREDITS[plan], users.plan updated.
3. subscription canceled (customer.subscription.deleted) → users.plan = free, credit_balance = 0.
4. Free user upgrade → after checkout + invoice.paid, users.plan changes to standard/pro.
5. Webhook: invalid signature → 400.

## Edge Cases
- Webhook does not require auth; signature verification mandatory.
- Subscription insert/update uses service role (RLS bypass).
