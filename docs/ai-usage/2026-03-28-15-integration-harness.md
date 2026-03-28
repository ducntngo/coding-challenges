# 2026-03-28-15-integration-harness.md

## AI Usage Log: Integration Harness

## Date

2026-03-28

## Timestamp

2026-03-28T11:25:00+07:00

## Related Context

- Branch: `feat/integration-harness`
- Related commit: `[feat] Add integration harness`

## User Input And Decisions

- asked to merge the disconnect slice and move immediately into the integration harness
- clarified that the early integration scenario is still useful before every feature is complete, as long as unfinished parts can be stubbed behind the established interfaces
- required that the original test suite and the new integration harness be separated operationally, not just mixed under one generic test command

## Task Summary

Added the first headless WebSocket integration harness using the real app, transport, session service, and in-memory store, covering multiple players across concurrent quiz sessions plus reconnect and disconnect behavior. Also fixed the WebSocket registration order exposed by the harness and split the automated tests into dedicated unit and integration suites.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- review the current WebSocket route and dependency seams before writing the harness
- design a first-pass scenario that exercises join, reconnect, disconnect, and session isolation without waiting for answer scoring to be complete
- expose and then fix a real handshake bug in the WebSocket route registration order
- split the test suite into unit and integration commands and update the repo docs around that separation

## Outputs Influenced By AI

- updated `src/app/create-app.ts`
- updated `package.json`
- updated `CONTRIBUTING.md`
- added `test/integration/headless-harness.test.ts`
- moved `test/unit/create-app.test.ts`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/implementation/05-testing-and-submission.md`
- this AI usage log entry

## Verification And Refinement

- ran `npm run typecheck`
- ran `npm run test:unit`
- ran `npm run test:integration`
- ran `npm test`
- ran `npm run build`
- reran the integration suite with local port access because the WebSocket harness requires a real loopback listener in this environment
- corrected an integration assertion after confirming the lazily created secondary session starts from version `0` rather than the seeded demo session baseline

## Human Judgment Applied

- chose to build the harness against the real WebSocket boundary instead of simulating transport calls in-process
- chose to keep answer submission and scoring out of the first harness pass, while still making the harness useful now for concurrency, reconnect, disconnect, and isolation coverage
- chose to split unit and integration suites explicitly in both file layout and package scripts once the separation requirement was called out

## Follow-Up

- implement the first accepted `answer.submit` path
- expand the existing integration harness to cover answer acceptance, result mapping, and leaderboard updates
- keep unfinished scoring behavior stubbed only until the real scoring flow lands
