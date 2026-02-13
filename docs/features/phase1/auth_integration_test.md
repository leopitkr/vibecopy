# Feature: Auth 연동 테스트

## Milestone Item
- Milestone: Phase 1 / Supabase 설정
- Checkbox: Auth 연동 테스트

## Summary
Supabase Auth (email/password) with App Router: trigger to auto-create `public.users` on signup, browser and server Supabase clients via `@supabase/ssr`, login/signup pages, middleware for session refresh, and `/me` RLS test page that shows the current user's profile or "not logged in". No Stripe, no generate API.

## Files Changed
- supabase/migrations/20260213100000_auth_users_profile_trigger.sql (new)
- lib/supabase/client.ts (new)
- lib/supabase/server.ts (new)
- app/login/page.tsx (new)
- app/signup/page.tsx (new)
- app/me/page.tsx (new)
- app/me/SignOutButton.tsx (new)
- middleware.ts (new)
- .env.example (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- docs/features/phase1/auth_integration_test.md
- require/VibeCopy_Development_Milestones.md (on finalize)
- package.json (deps: @supabase/ssr, @supabase/supabase-js)

## How to Test
1. **Env:** Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API.
2. **Trigger:** Run `supabase/migrations/20260213100000_auth_users_profile_trigger.sql` in Supabase SQL Editor (if not already applied).
3. **Run:** `pnpm dev`. Open http://localhost:3000.
4. **Signup:** Go to http://localhost:3000/signup. Enter email and password (min 6 chars). Submit. You should be redirected to `/me`.
5. **RLS / profile:** On `/me` you should see your `public.users` row (id, email, plan, credit_balance). If you see "Error loading profile", ensure the trigger ran and the row exists in Table Editor.
6. **Sign out:** Click "Sign out" on `/me`. You should be on `/` and unauthenticated.
7. **Login:** Go to `/login`, enter the same email/password. You should be redirected to `/me` and see the same profile.
8. **Not logged in:** Open `/me` in an incognito window (or after sign out). You should see "Not logged in" and a link to `/login`.

## RLS verification steps
- **Own row only:** While logged in as user A, open `/me`. Only user A's row is returned (RLS `users_select_own`). You cannot see other users' data.
- **No row when anonymous:** Without logging in, `/me` does not call `from("users").select()` with a user id; the page shows "Not logged in". If you had a server route that queried `users` without a session, it would return no rows (RLS denies).
- **Trigger:** After signup, in Supabase Dashboard → Table Editor → `public.users`, confirm a row with the same `id` as in Authentication → Users. This confirms the trigger created the profile.

## Known limits
- Email confirmation is not enforced in this milestone (Supabase can require it in Auth settings).
- No protected route redirect in middleware (e.g. redirect `/me` to `/login` when unauthenticated); `/me` handles both states in the UI.
- No password reset or email verification flow.

## Follow-ups (optional)
- 회원가입 페이지 / 로그인 페이지 (already implemented; milestone can be checked).
- 로그아웃 기능, 세션 유지 처리 (implemented; document and check).
- Optional: redirect unauthenticated users from `/me` to `/login` in middleware.
