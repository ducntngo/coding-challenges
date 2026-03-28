# 2026-03-28-03-scoring-and-leaderboard-design.md

## Module Working Log: Scoring And Leaderboard First Stable Pass

## Date

2026-03-28

## Timestamp

2026-03-28T07:25:58+0700

## Session Goal

Replace the placeholder `docs/modules/scoring-and-leaderboard.md` outline with a stable first-pass module contract that defines accepted-vs-rejected submission semantics, score mutation boundaries, ranking policy integration, and leaderboard result shapes.

## Decisions Logged

- scoring owns deterministic answer-processing and ranking logic, but not transport envelopes or authoritative session persistence
- accepted and rejected submissions are distinct outcomes
- an incorrect first submission is accepted with zero score, while duplicate or late submissions are rejected and must not mutate state
- score calculation and ranking are separate policy boundaries
- the default ranking rule is total score descending with earlier participant creation or join order as the fallback tie-break
- scoring should return transport-visible result objects without embedding transport-layer event envelopes

## Rationale

- separating accepted-vs-rejected outcomes makes duplicate handling and zero-score incorrect answers easier to reason about
- keeping scoring and ranking separate preserves flexibility for later tuning
- transport-neutral result objects keep the core logic easier to unit test and easier to reuse across transport choices

## Open Questions

- exact positive scoring formula for correct answers `[needs verification]`
- exact rejection code set for late, duplicate, and invalid-question submissions `[needs verification]`
- whether transport needs both incremental score updates and full leaderboard snapshots after every accepted answer `[questionable]`

## Follow-Up

- refine `docs/modules/observability-and-operations.md`
- define the minimum logs, metrics, and diagnosis paths for the challenge scope
- run the planned open-questions review after the full module pass is complete

## Update 2026-03-28T15:25:00+07:00

### Decisions Logged

- the first concrete score policy now uses server-observed `currentQuestionOpenedAtMs` plus answer receive time instead of a transport-level sentinel
- the default policy keeps a short full-score grace window and then linearly decays to a positive floor for correct answers
- seeded empty sessions should refresh their question-open timestamp when the first real participant joins so idle process time does not silently reduce the first score

### Rationale

- this satisfies the challenge rule that faster correct answers score higher without forcing a deeper scoring redesign
- keeping the timing inputs in session state preserves the transport boundary and keeps scoring testable
- a simple linear baseline is easier to explain in the submission than a more speculative formula

### Open Questions

- whether the current grace window, decay window, and score floor should remain unchanged for the final submission `[questionable]`
- which richer late-answer scenarios should be covered next in the headless harness `[needs verification]`
