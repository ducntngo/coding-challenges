# 2026-03-28-29-demo-flow-and-observability.md

## AI Usage Log: Demo Flow And Observability

## Date

2026-03-28

## Timestamp

2026-03-28T16:42:00+07:00

## Related Context

- Branch: `feat/demo-flow-observability`
- Related commit: `[feat] Add demo flow logs`

## User Input And Decisions

- asked to move on after the doc-only production-path clarification PR was merged
- clarified that BigQuery is not the right live retrieval path for leaderboard serving and suggested an operational SQL read model plus near-real-time Kafka-style fanout for larger systems
- asked to return to Stage 6 and wrap the remaining demo-flow and observability work up

## Task Summary

Added a minimal structured logging baseline around the existing transport and progression seams, documented the reviewer-facing run and demo flow, and updated the implementation trackers so Stage 6 can close cleanly. Also refined the scoring design doc to distinguish live leaderboard serving from downstream analytics.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- factor the runtime log-field mapping into a small pure helper with targeted unit coverage
- add lightweight logging without widening the transport contract or introducing extra infrastructure
- write a reviewer-facing demo-flow document that reuses the current server and integration harness instead of adding more runtime code
- update the status, plan, module log, and AI diary trail for the Stage 6 close-out

## Outputs Influenced By AI

- added `src/observability/runtime-log-events.ts`
- updated `src/transport/register-transport-routes.ts`
- added `test/unit/runtime-log-events.test.ts`
- added `docs/implementation/06-demo-flow.md`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/implementation/05-testing-and-submission.md`
- updated `docs/implementation/headless-integration-scenario.md`
- updated `docs/modules/scoring-and-leaderboard.md`
- added `docs/modules/logs/2026-03-28-05-observability-hook-baseline.md`
- this AI usage log entry

## Verification And Refinement

- ran `npm run typecheck`
- ran `npm test`
- ran `npm run build`
- used unit coverage for the pure log-event helper instead of logger-mocking tests

## Human Judgment Applied

- chose to log at the transport and progression seams because those already summarize runtime outcomes cleanly
- chose a docs-driven reviewer demo path rather than adding a dedicated demo client, to keep the total code footprint smaller
- incorporated the user guidance that BigQuery belongs in downstream analytics, not live leaderboard retrieval

## Follow-Up

- move into Stage 7 submission packaging
- tighten the final reviewer narrative, AI collaboration summary, and walkthrough support docs
