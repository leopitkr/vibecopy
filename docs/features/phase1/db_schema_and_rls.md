# Feature: DB schema and RLS (Phase 1)

## Milestone Items
- Phase 1 / Supabase 설정: Users 테이블 생성, Generations 테이블 생성, Subscription 테이블 생성, RLS 정책 설정

## Summary
Single migration `20260213000000_vibecopy_schema_v1.sql` defines tables (public.users, public.generations, public.subscriptions), enums, updated_at triggers, indexes, RLS enabled on all three, and policies: users (owner select/update/insert), generations (owner CRUD), subscriptions (owner select only; no client insert/update).

## Files
- supabase/migrations/20260213000000_vibecopy_schema_v1.sql (existing)
- docs/features/phase1/db_schema_and_rls.md

## How to apply migration
- **Supabase SQL Editor:** Dashboard → SQL Editor → New query → paste full contents of `supabase/migrations/20260213000000_vibecopy_schema_v1.sql` → Run.
- **Supabase CLI:** From project root, `supabase link` (if not linked), then `supabase db push` to apply pending migrations.

## How to verify RLS/policies in Supabase
1. **Tables:** Table Editor → confirm `public.users`, `public.generations`, `public.subscriptions` exist with expected columns.
2. **RLS:** Table Editor → open a table → check "RLS enabled" (or Authentication → Policies). All three tables should have RLS enabled.
3. **Policies:** Database → Roles and Permissions, or Table Editor → table → View policies. Expect:
   - **users:** select/update/insert for `auth.uid() = id`.
   - **generations:** select/insert/update/delete for `auth.uid() = user_id`.
   - **subscriptions:** select for `auth.uid() = user_id`; no insert/update for anon/authenticated (service role only).

## App-based verification
- **Logged in:** Open `/me`. Page fetches `public.users` for current user; you should see your row (id, email, plan, credit_balance). Confirms RLS allows select where `auth.uid() = id`.
- **Anonymous:** Without logging in, no Supabase query runs for users in the app; if you had an API that queried `users` without a session, it would return no rows (RLS denies).
- **Cross-user:** Logged in as user A, you cannot read user B's row; RLS restricts by `auth.uid()`.

## Verification steps (brief)
1. Apply migration (SQL Editor or `supabase db push`).
2. In Dashboard, confirm three tables exist and RLS is enabled; confirm policies as above.
3. In app: log in, go to `/me`, confirm your `public.users` row is visible.
