# 2026-03-28-25-linear-scoring-timing.md

## AI Usage Log: Linear Scoring Timing

## Date

2026-03-28

## Timestamp

2026-03-28T15:25:00+07:00

## Related Context

- Branch: `feat/question-open-timing`
- Related commit: `[feat] Add linear score timing`

## User Input And Decisions

- asked to keep going in small, self-contained PRs before merging the earlier stacked PRs
- reiterated that each PR should stay as one evolving commit and be squash-merged
- explicitly asked not to go deep on the scoring formula and to use a simple linear function so stage 5 can wrap soon

## Task Summary

Added session-owned question-open timing so scoring can use server-observed elapsed time without transport changes, replaced the fixed-score stub with a simple linear timing policy for correct answers, and added focused unit coverage for timing persistence, seeded-session refresh, decay behavior, and the minimum score floor.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- inspect the in-progress scoring and timing changes against the current module docs before finalizing the slice
- identify that a pre-seeded empty session could accidentally decay the first answer score just from server idle time
- refine the session join behavior so the first real participant refreshes question-open timing for the seeded demo session
- keep the score policy intentionally simple: server-observed timing, short full-score grace window, linear decay, positive floor
- update the status, plan, module docs, and working log so the remaining stage-5 work narrows to richer late-answer coverage

## Outputs Influenced By AI

- updated `src/session/contracts.ts`
- updated `src/session/session-aggregate.ts`
- updated `src/session/stub-quiz-session-service.ts`
- updated `src/session/stub-session-progression-service.ts`
- updated `src/store/in-memory-session-store.ts`
- updated `src/answer-submission/stub-answer-submission-service.ts`
- updated `src/scoring/contracts.ts`
- updated `src/scoring/stub-scoring-service.ts`
- updated `src/app/dependencies.ts`
- updated `test/unit/scoring-service.test.ts`
- updated `test/unit/session-progression-service.test.ts`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/modules/scoring-and-leaderboard.md`
- updated `docs/modules/logs/2026-03-28-03-scoring-and-leaderboard-design.md`
- updated `docs/implementation/05-testing-and-submission.md`
- updated `docs/implementation/headless-integration-scenario.md`
- this AI usage log entry

## Verification And Refinement

- ran `npm test`
- ran `npm run build`
- refined the join-time timing behavior after noticing that store-seeded empty sessions could otherwise inherit stale question-open timestamps

## Human Judgment Applied

- chose not to introduce a more complex timing or weighting model because the user explicitly preferred a simple linear function
- chose to keep timing data in authoritative session state instead of transport payloads so the scoring seam stays replaceable
- chose to stop this slice at the scoring baseline and documentation update rather than bundling late-answer harness work into the same PR

## Follow-Up

- add the next small PR for richer late-answer coverage through the existing headless harness
- decide later whether the current timing constants should stay unchanged for the final submission
