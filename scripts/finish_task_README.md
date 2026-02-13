# finish_task.mjs (Milestone hash auto-updater)

This script automates the rules in `require/cursor.rule`:

- When a milestone item is completed:
  - create/update a feature doc under `docs/features/...`
  - commit the implementation
  - update the milestone checkbox line to `- [x] ... (commit: <SHORT_HASH>)`
  - record the actual short hash automatically
  - commit the milestone update (docs-only commit)

## Why two commits?
Git hashes are only known **after** committing. If you want the milestone file to reference the implementation hash,
the safest method is:
1) feature commit
2) docs commit that writes the feature hash into the milestone file

## Install
Copy `scripts/finish_task.mjs` into your repo.

(Optional) add to package.json:
```json
{
  "scripts": {
    "finish": "node scripts/finish_task.mjs"
  }
}
```

## Usage
```bash
pnpm finish --item "ESLint / Prettier 설정" \
  --milestone "require/VibeCopy_Development_Milestones.md" \
  --doc "docs/features/phase0/eslint_prettier_setup.md" \
  --msg "chore: add ESLint/Prettier setup"
```

## Notes / Safety
- `--item` must exactly match the checkbox label text in the milestone file.
- The script stages everything with `git add -A` for the feature commit.
  - If you want tighter control, stage files yourself and modify the script to avoid `-A`.
- This script does not create branches. Create branches manually or extend it.

## Cursor Prompt (recommended)
Tell Cursor to finalize like this:
1) Ensure docs file exists/updated
2) Run `pnpm finish --item "<EXACT ITEM>" --doc "<DOC PATH>" --msg "<COMMIT MSG>"`
3) Confirm milestone line has real hash and both commits exist
