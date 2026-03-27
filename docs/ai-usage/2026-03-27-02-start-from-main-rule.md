# 2026-03-27-02-start-from-main-rule.md

## AI Usage Log: Start From Main Rule

## Date

2026-03-27

## Timestamp

2026-03-27T21:10:37+07:00

## Related Context

- Branch: `docs/start-from-main-rule`

## Task Summary

Update repository guidance to require starting new work from `main` after syncing with `git pull --rebase`, and define branch naming and commit message conventions.

## AI Tools Used

- AI coding assistant in the local development environment

## Interaction Summary

AI was used to:

- inspect the current branch and remote state
- switch back to the default branch and update it with rebase
- apply narrow governance changes in `AGENTS.md` and `CONTRIBUTING.md`

## Outputs Influenced By AI

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/ai-usage/2026-03-27-02-start-from-main-rule.md`

## Verification And Refinement

- Verified that the repository default branch is `main`, not `master`.
- Updated local `main` using `git pull --rebase origin main` before making the rule change.
- Kept the change scoped to workflow rules so it can ship as a small PR.
- Incorporated additional review guidance to standardize branch prefixes and concise commit subjects.

## Human Judgment Applied

- Chose to encode the sync-from-`main` expectation explicitly in `AGENTS.md` to reduce branch drift in future sessions.
- Chose to standardize branch naming with prefixes like `feat/`, `fix/`, `chore/`, and `docs/`.
- Chose to keep commit subjects short and readable, with more detail in the commit body when needed.

## Follow-Up

- Merge this PR so future work starts from an up-to-date trunk branch by default.
