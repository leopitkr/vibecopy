# Claude/Cursor Project Rules — VibeCopy
_Last updated: 2026-02-13_

These rules are the **single source of truth** for how we implement VibeCopy using **Claude Code / Cursor**.
Follow them strictly to keep the project maintainable for a solo developer, with predictable progress tracking.

---

## 0) Guiding Principles
- **Ship the smallest valuable increment** (MVP first). Avoid “nice-to-have” features unless explicitly planned in the milestone.
- **One change set = one purpose.** Keep each task narrowly scoped.
- **Security and cost control are features.** Treat them as first-class requirements.
- **Prefer configuration over customization.** Reuse existing libraries/services rather than building custom infra.

---

## 1) Project Structure (Required)
- `app/` — Next.js App Router UI
- `app/api/` — Server routes (serverless functions)
- `lib/` — reusable modules (OpenAI client, billing helpers, guards, constants)
- `components/` — UI components
- `supabase/` — SQL migrations, RLS policies, seed scripts
- `docs/` — **feature completion notes** (mandatory)
- `require/` — PRD, Tech Design, Milestones, Rules
- `scripts/` — local scripts (lint, format, seed, etc.)

> Do not create random folders. If needed, extend this list and document it in `docs/architecture.md`.

---

## 2) Branching & Workflow (Solo-friendly)
- Default branch: `main`
- Work branch per feature: `feat/<milestone-id>-<short-name>`
  - Example: `feat/p2-generate-api`
- Merge strategy: **rebase** onto `main` when possible (keeps history clean).
- Every feature must end with:
  1) **docs** file created/updated  
  2) **milestone checkbox checked**  
  3) **git commit with hash recorded**

---

## 3) Coding Standards (Required)
### Language & Framework
- TypeScript only (no JS files unless unavoidable).
- Next.js App Router patterns only.

### Style
- Run formatter before committing:
  - `pnpm lint`
  - `pnpm format` (or equivalent)
- Keep functions small:
  - Prefer 30–60 lines per function/module
- Avoid duplication:
  - If logic repeats 2x, extract to `lib/`.

### Error Handling
- All API routes must:
  - Validate inputs
  - Return structured JSON `{{ ok: boolean, data?: ..., error?: {{ code, message }} }}`
  - Use consistent HTTP status codes
- Never leak sensitive details in error messages.

### Type Safety
- No `any` unless explicitly justified in code comments.
- Use Zod (or equivalent) for runtime validation in API inputs.

---

## 4) Documentation Rules (MANDATORY)
### 4.1 Feature Completion Docs
Whenever a feature/task is completed, create a document under `docs/`.

**Path format**
- `docs/features/<milestone-phase>/<feature_slug>.md`
  - Example: `docs/features/phase2/generate_api.md`

**Minimum required template**
```md
# Feature: <name>

## Milestone Item
- Milestone: <Phase X / section>
- Checkbox: <exact checkbox label>

## Summary
What was implemented and why.

## Files Changed
- <file path 1>
- <file path 2>

## How to Test
Step-by-step manual test instructions.

## Edge Cases / Known Limits
Anything intentionally not covered.

## Screenshots (optional)
Paste links or notes.

## Follow-ups (optional)
Next improvements.
```

### 4.2 Architecture/Decision Logs
For any meaningful design decision (DB schema changes, billing logic changes, prompt format changes):
- Add a short note to `docs/decisions.md` with:
  - Decision
  - Why
  - Alternatives considered
  - Consequences

---

## 5) Milestone Tracking (MANDATORY)
We track progress in:
- `require/VibeCopy_Development_Milestones.md`

### 5.1 When a milestone checkbox is completed
Do all of the following:
1) Check the checkbox from `- [ ]` to `- [x]`
2) Append the git commit hash on the same line in this format:
   - `- [x] <item text>  (commit: <SHORT_HASH>)`

Example:
```md
- [x] /api/generate 라우트 생성  (commit: a1b2c3d)
```

### 5.2 One checkbox = one commit (Default)
- Prefer: **1 milestone checkbox = 1 commit**
- Exception: if the task is extremely small, you may bundle up to 3 items **only if** they are in the same sub-section and tightly related.
- If you bundle, you still must update every checked line with the same commit hash.

---

## 6) Git Commit Rules (MANDATORY)
### 6.1 Commit Message Format
Use conventional-style messages:
- `feat: ...` new feature
- `fix: ...` bug fix
- `chore: ...` tooling / refactor
- `docs: ...` documentation only
- `test: ...` tests

Examples:
- `feat: add generate API route`
- `feat: implement credit deduction transaction`
- `fix: handle OpenAI timeout gracefully`

### 6.2 Commit Checklist
Before committing:
- `pnpm lint` passes
- `pnpm test` passes (if tests exist for that area)
- No secrets in git diff
- `docs/features/...` created/updated
- Milestone checkbox updated with `(commit: <hash>)`

After committing:
- Copy the **short hash** and paste into the milestone line.

> If you use Claude/Cursor to automate this, it must still perform the above steps explicitly.

---

## 7) Testing Requirements (Minimum)
- API routes must have at least:
  - One happy path test (manual steps documented)
  - One validation failure scenario (documented)
- Billing/webhook logic must include:
  - Idempotency behavior
  - Replay webhook safe handling
- Credit logic must prove:
  - No double-deduction on retries

If automated tests are not implemented yet, document manual test steps in the feature doc.

---

## 8) Security & Compliance (NON-NEGOTIABLE)
- Never commit secrets:
  - `.env*` must be in `.gitignore`
  - Use `.env.example` with placeholders only
- Store API keys only in environment variables.
- Ensure RLS policies in Supabase:
  - Users can read/write only their own data
- Rate limit public endpoints (at least basic protection).
- Add content safety checks:
  - Input length limits
  - Basic forbidden-terms filter (per Tech Design)
- Avoid scraping/crawling in MVP unless explicitly approved.

---

## 9) Cost Control Rules
- Enforce input size limits (characters + tokens).
- Use model selection appropriate for MVP.
- Set `max_output_tokens` and reasonable timeouts.
- Track and log:
  - tokens used per request (if available)
  - request count per plan/day

---

## 10) Prompting & Output Contract Rules
- The `/api/generate` output must be **strict JSON** matching a defined schema.
- Never rely on “best effort” natural language parsing.
- If the model returns invalid JSON:
  - Retry once with a repair prompt
  - If still invalid, return a structured error

---

## 11) Internationalization / Expansion Readiness
- Keep user-facing strings centralized when possible (`lib/strings.ts`).
- Avoid hardcoding currency formatting where feasible.
- Plan fields must be compatible with future region pricing.

---

## 12) Definition of Done (DoD)
A feature is “Done” only when:
- Code implemented
- Lint passes
- Manual test steps executed (and documented)
- `docs/features/...` file created/updated
- Milestone checkbox checked + commit hash recorded
- Commit pushed to `main` (or ready to merge)

---

## 13) Files to Create Now
Create one of these (based on your tool):
- `claude.md` (for Claude Code)
- `cursor.rule` (for Cursor)
- You may keep both identical.

Recommended: store in `require/` as well:
- `require/claude.md` and/or `require/cursor.rule`

---

## 14) Quick Start Commands (Suggested)
(Adjust as needed for your package manager)
- Install: `pnpm i`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Build: `pnpm build`

---

If any rule conflicts with PRD/Tech Design:
- **PRD wins** for product decisions
- **Tech Design wins** for engineering decisions
