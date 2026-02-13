# Feature: Generate API route (Phase 2)

## Milestone Item
- Milestone: Phase 2 / API 구현
- Checkbox: /api/generate 라우트 생성

## Summary
Implemented `POST /api/generate` to produce structured copy (headlines, benefits, shortform scripts, CTAs, risk_check) from URL or text input. Uses server-side Supabase auth, Zod-validated body, OpenAI gpt-4o-mini with strict JSON and one repair attempt, and logs each successful generation to `public.generations`. No credits or Stripe.

## Files Changed
- app/api/generate/route.ts
- lib/openai/client.ts
- lib/prompts/generateCopy.ts
- docs/features/phase2/generate_api.md

## How to Test

### 1. Auth (session cookie)
- Log in via the app (e.g. Supabase Auth) so the browser has a session.
- Get the session cookie name/value from DevTools (Application → Cookies) for your app origin.
- Call the API with that cookie:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project-ref>-auth-token=<session-cookie-value>" \
  -d '{"input_type":"text","input_value":"Organic face cream for dry skin","channel":"smartstore","vibe":"trust"}'
```

- Expected: `200` with `{ "ok": true, "data": { "headlines": [...], "benefits": [...], ... } }`.
- Without valid session: `401` with `{ "ok": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }`.

### 2. Optional test route strategy
- Add a temporary page (e.g. `app/test-generate/page.tsx`) that uses `fetch("/api/generate", { method: "POST", body: JSON.stringify({...}), credentials: "include" })` so the browser sends cookies automatically. Remove after verification.

### 3. DB verification
- After a successful call, check `public.generations`: one new row with `user_id`, `channel`, `vibe`, `input_type`, `input_value`, `output_json`, `model`, and token/latency fields if available.

## Edge Cases / Known Limits
- No credits logic; no Stripe.
- Invalid or non-JSON OpenAI response: one repair attempt (retry with invalid output + repair prompt), then 502 with `GENERATION_INVALID`.
- Missing or invalid body: 400 with `INVALID_JSON` or `VALIDATION_ERROR`.
- Insert failure into `generations`: 500 with `DB_ERROR`; error is not swallowed.

## Follow-ups
- Add credit deduction and balance checks (Phase 2 credits system).
- Optional: rate limiting, request id for tracing.
