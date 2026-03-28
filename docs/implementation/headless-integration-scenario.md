# headless-integration-scenario.md

## Headless Integration Scenario

## Status

Active companion document for the automated integration harness at `test/integration/headless-harness.test.ts`.

## Purpose

Describe the current end-to-end integration scenario in plain language so a reviewer can understand what the automated harness is proving without reading the test file first.

## Current Scenario

The harness currently drives four simulated players through the real WebSocket transport boundary:

- Alice joins `demo-quiz`
- Bob joins `demo-quiz`
- Carol joins `science-quiz`
- Dana joins `science-quiz`

The scenario then validates these behaviors:

1. Concurrent joins create or attach to the correct live session for each `quizId`.
2. Participants in `demo-quiz` are isolated from participants in `science-quiz`.
3. Both sessions keep their own `sessionInstanceId`, participant list, leaderboard, and version progression.
4. Alice submits a correct answer for `demo-quiz` question `question-1`.
5. Carol submits an incorrect answer for `science-quiz` question `question-1`.
6. The answer results mutate score and leaderboard state in the correct session only.
7. Alice reconnects on a replacement connection using her reconnect token.
8. A later disconnect from Alice's older connection is treated as stale and does not evict the replacement connection.
9. Bob disconnects from `demo-quiz`, and only his participant state changes to `disconnected`.
10. `science-quiz` remains unchanged while disconnect activity happens in `demo-quiz`.

## What The Harness Asserts

The automated harness currently checks:

- successful `session.join` responses for all four clients
- correct participant membership per session
- accepted `answer.submit` handling for the current stubbed scoring path
- `participant.score.updated` and `leaderboard.updated` command results for the submitting client
- leaderboard ordering within each session
- session snapshot state after accepted answers
- successful `session.reconnect` for a replacement connection
- stale-disconnect safety after reconnect
- disconnect state transition for another participant in the same session
- cross-session isolation throughout the sequence

## Current Limitations

This scenario intentionally reflects the current implementation rather than the final target behavior.

- accepted score and leaderboard updates are currently asserted only on the submitting connection
- session-wide fanout for score and leaderboard changes is not implemented yet
- the scoring behavior is still deterministic and stubbed rather than timing-based
- late-answer and question-phase rejection cases are not covered yet

## Expected Evolution

As the implementation deepens, this same scenario should grow rather than be replaced.

Next planned additions:

- session-wide fanout assertions for score and leaderboard updates
- duplicate, late, and wrong-question rejection scenarios
- richer scoring behavior behind the existing interfaces
- more question-phase-aware answer handling

## Reviewer Guidance

To inspect the current automated scenario:

- read `test/integration/headless-harness.test.ts`
- run `npm run test:integration`
- use this document as the plain-language walkthrough for the same flow
