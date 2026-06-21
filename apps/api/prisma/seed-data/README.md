# Database Seed Data

This directory holds the reusable seed inputs for the ElevateSDE database. None of these files are throwaway — they are the source of truth for seeding and are safe to re-run on any machine.

## Layout

- `leetcode/problems.dataset.json` — the coding problem bank (2,788 real problems sourced from the public [neenza/leetcode-problems](https://github.com/neenza/leetcode-problems) dataset). Each entry carries real content (title, markdown description, examples, constraints, topic tags, multi-language starter code, and the resolved `functionName`). The `testCases` array is intentionally empty for now — fill it in over time to make a problem runnable.
- `leetcode/index.ts` — typed loader for the dataset file.
- `problems-seeder.ts` — idempotent seeder. Bulk-inserts problem content (skips problems that already exist) and, for any problem whose `testCases` array is non-empty, refreshes that problem's test cases.
- `problems/` — the parameterized problem-family generator (kept as a tool). Use it to generate executable test cases with verified expected outputs when you are ready to author them.

## How to seed on a fresh machine

```bash
# 1. Start Postgres (repo root)
docker compose up -d postgres

# 2. From apps/api: apply migrations + run the full seed (users, flags, problems)
pnpm --filter=@elevatesde/api db:setup

# Or seed only the coding problems:
pnpm --filter=@elevatesde/api db:seed:problems
```

`DATABASE_URL` must point at the target Postgres instance.

## Adding test cases to a problem

1. Open `leetcode/problems.dataset.json` and find the problem by `slug`.
2. Add entries to its `testCases` array. Each test case is:
   ```json
   { "input": "[2,7,11,15], 9", "expectedOutput": "[0,1]", "isHidden": false }
   ```
   - `input` is the function arguments as a JSON array body **without** the outer brackets (so the runner evaluates `JSON.parse("[" + input + "]")`).
   - `expectedOutput` is the canonical JSON of the expected return value.
   - `isHidden: true` keeps the case off the candidate-facing problem view.
3. Re-run `pnpm --filter=@elevatesde/api db:seed:problems`. Existing test cases for that problem are replaced with the JSON contents; problems with an empty `testCases` array are left untouched, so candidate progress is preserved.

Until a problem has test cases, the UI shows a "Test cases coming soon" notice and disables grading.
