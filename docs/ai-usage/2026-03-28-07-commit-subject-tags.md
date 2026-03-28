# 2026-03-28-07-commit-subject-tags.md

## AI Usage Log: Commit Subject Tag Rule

## Date

2026-03-28

## Timestamp

2026-03-28T07:46:21+0700

## Related Context

- Branch: `docs/commit-message-tags`
- Related commit: not committed yet

## Task Summary

Update the repository workflow docs so commit subjects must include a short type tag such as `[feat]`, `[fix]`, `[chore]`, or `[docs]`.

## AI Tools Used

- Codex / GPT-based coding assistant in the local development environment

## Interaction Summary

AI was used to:

- recheck the current governance docs for the existing commit-subject rules
- add the explicit commit-tag requirement to both `AGENTS.md` and `CONTRIBUTING.md`
- record the policy change in the implementation status and AI diary

## Outputs Influenced By AI

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ai-usage/2026-03-28-07-commit-subject-tags.md`

## Verification And Refinement

- Confirmed that the existing docs required branch type prefixes but did not require commit-subject tags.
- Added the same commit-subject rule to both governance docs so they stay aligned.
- Kept the rule short and prescriptive without changing the existing subject-length guidance.

## Human Judgment Applied

- Chose to require commit-subject tags explicitly instead of relying on branch naming alone.
- Chose the same tag examples already implied by the existing branch prefixes to keep the convention consistent.

## Follow-Up

- Use commit-subject tags consistently in future PRs and squash-merge commit titles.
