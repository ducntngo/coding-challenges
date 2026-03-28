# 2026-03-28-16-integration-harness-rules.md

## AI Usage Log: Integration Harness Rules

## Date

2026-03-28

## Timestamp

2026-03-28T11:45:00+07:00

## Related Context

- Branch: `docs/integration-harness-rules`
- Related commit: `[docs] Add harness workflow rules`

## User Input And Decisions

- required that future module implementation treat the integration harness as a standing guard rail
- required that changes to runtime behavior or relevant stubs keep the harness passing
- required that new end-to-end scenarios be added to the existing integration harness instead of creating disconnected one-off integration flows

## Task Summary

Updated the repository workflow and testing docs so the integration harness is now an explicit ongoing requirement for future module work, not just a milestone that happened once.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- identify the governance and handoff docs that should carry the harness maintenance rule
- draft concise policy wording that covers both preserving the harness and extending it when new scenarios become possible
- align the test-plan document with the same expectation so implementation and submission docs do not drift

## Outputs Influenced By AI

- updated `AGENTS.md`
- updated `CONTRIBUTING.md`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/implementation/05-testing-and-submission.md`
- this AI usage log entry

## Verification And Refinement

- reviewed the current governance and handoff docs before editing so the new rule lands in the right places
- kept the wording short and directive to match the existing repo style
- no code or test changes were required for this docs-only rule update

## Human Judgment Applied

- chose to make the harness-preservation rule explicit in both governance and implementation handoff docs rather than relying on implicit team memory
- chose to treat new scenarios as extensions of the current harness instead of allowing multiple disconnected integration paths to accumulate

## Follow-Up

- next implementation slice remains the first accepted `answer.submit` path
- expand the current integration harness alongside that work instead of starting a separate answer-flow scenario elsewhere
