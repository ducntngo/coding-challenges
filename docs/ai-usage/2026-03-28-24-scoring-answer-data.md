# 2026-03-28-24-scoring-answer-data.md

## AI Usage Log: Scoring Answer Data

## Date

2026-03-28

## Timestamp

2026-03-28T15:12:21+07:00

## Related Context

- Branch: `feat/scoring-service-tests`
- Related commit: `[feat] Use quiz answer data`

## User Input And Decisions

- asked to continue to the next slice before merging the prior PR
- reiterated the rule that each PR should stay small and squash to one commit
- did not ask for a broad scoring-model redesign, which kept this slice limited to making the current scoring seam less fake without widening transport or session state

## Task Summary

Extended quiz definitions with minimal accepted-answer data, passed that answer data through the existing `ScoringService` seam, and updated the stub scoring implementation so correctness now comes from quiz content instead of a hard-coded `"correct"` sentinel. Added focused unit coverage for scoring against quiz data and kept the rest of the transport and session flow unchanged.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- inspect the current scoring seam, quiz-definition model, and test coverage to choose the next smallest credible scoring slice
- decide not to attempt the final timing-based formula yet because the repo still lacks question-open timestamps and a wider runtime model for that behavior
- extend the quiz-definition contract with minimal accepted-answer data
- thread quiz-backed answer correctness through `AnswerSubmissionService` into `ScoringService`
- add focused unit coverage proving scoring compares against quiz-definition answers rather than the literal string `"correct"`
- update the project tracker docs so the next unresolved work narrows to the score formula itself

## Outputs Influenced By AI

- updated `src/quiz-source/contracts.ts`
- updated `src/quiz-source/mock-quiz-definition-source.ts`
- updated `src/answer-submission/stub-answer-submission-service.ts`
- updated `src/scoring/contracts.ts`
- updated `src/scoring/stub-scoring-service.ts`
- updated `test/integration/headless-harness.test.ts`
- added `test/unit/scoring-service.test.ts`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/implementation/05-testing-and-submission.md`
- updated `docs/implementation/headless-integration-scenario.md`
- this AI usage log entry

## Verification And Refinement

- ran `npm test`
- ran `npm run build`
- kept the seeded and integration quiz answers aligned with the current accepted-answer expectations so existing harness behavior remained stable while the seam changed

## Human Judgment Applied

- chose to keep the scoring behavior fixed at `100` or `0` for now because implementing the final timing-based formula would require a wider state and protocol slice
- chose to make correctness quiz-backed now because that meaningfully reduces “magic behavior” without thickening transport
- chose not to merge this with the previous rejection-coverage PR so each PR remains coherent and review-sized

## Follow-Up

- add the server-timestamped data needed for the final timing-based scoring formula
- keep late-answer coverage growing in the headless harness
- decide later whether the scoring seam should expose richer result data once the score formula gets more realistic
