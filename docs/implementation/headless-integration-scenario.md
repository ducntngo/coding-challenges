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
7. The resulting score and leaderboard updates fan out to the other active participant in the same session.
8. Alice reconnects on a replacement connection using her reconnect token.
9. A later disconnect from Alice's older connection is treated as stale and does not evict the replacement connection.
10. Bob disconnects from `demo-quiz`, and only his participant state changes to `disconnected`.
11. `science-quiz` remains unchanged while disconnect activity happens in `demo-quiz`.

The harness also includes a smaller rejection scenario:

- a participant joins `demo-quiz`
- the session phase is moved to `question_closed`
- a later `answer.submit` attempt is rejected without mutating session state

And another rejection scenario:

- a participant joins `demo-quiz`
- the internal progression service advances the session from `question-1` to `question-2`
- a later `answer.submit` attempt for the previous question is rejected without mutating session state
- a submission for the new active question is still accepted

## What The Harness Asserts

The automated harness currently checks:

- successful `session.join` responses for all four clients
- correct participant membership per session
- accepted `answer.submit` handling for the current stubbed scoring path
- `participant.score.updated` and `leaderboard.updated` command results for the submitting client
- session-wide fanout of the same two events to the other active participant in that session
- omission of `requestId` on passive fanout copies
- leaderboard ordering within each session
- session snapshot state after accepted answers
- successful `session.reconnect` for a replacement connection
- stale-disconnect safety after reconnect
- disconnect state transition for another participant in the same session
- cross-session isolation throughout the sequence
- rejection when a session is not in `question_open`
- rejection when a submission targets a question other than the active `currentQuestionId`
- successful acceptance after internal progression moves the active question forward

## Current Limitations

This scenario intentionally reflects the current implementation rather than the final target behavior.

- the scoring behavior is still deterministic and stubbed rather than timing-based
- the current scaffold starts sessions in `question_open` because host-driven phase progression is not implemented yet
- progression changes are not yet emitted to connected clients through transport events

## Expected Evolution

As the implementation deepens, this same scenario should grow rather than be replaced.

Next planned additions:

- duplicate and late-answer rejection scenarios once progression changes are surfaced through runtime events
- richer scoring behavior behind the existing interfaces
- more question-phase-aware answer handling

## Reviewer Guidance

To inspect the current automated scenario:

- read `test/integration/headless-harness.test.ts`
- run `npm run test:integration`
- use this document as the plain-language walkthrough for the same flow
