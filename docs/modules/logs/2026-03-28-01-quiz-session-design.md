# 2026-03-28-01-quiz-session-design.md

## Module Working Log: Quiz Session First Stable Pass

## Date

2026-03-28

## Timestamp

2026-03-28T06:48:22+0700

## Session Goal

Replace the placeholder `docs/modules/quiz-session.md` outline with a stable first-pass module contract and settle the highest-risk lifecycle and state-boundary decisions before moving to transport design.

## Decisions Logged

- there is at most one active live session instance per `quizId`, created lazily on the first join
- a live session should use an internal `sessionInstanceId` so the same `quizId` can create a fresh run after closure
- a session remains active while any participant has an active connection or a still-valid reconnect window
- cleanup eligibility requires no active connections and no reconnect-eligible participants, or an explicit end condition
- participant identity is server-issued, session-scoped, and survives disconnect until reconnect expiry
- reconnect uses the `quizId` plus an opaque server-issued token
- invalid or expired reconnect attempts are rejected instead of silently creating or hijacking participant state
- the latest valid reconnect replaces the prior active connection owner, and stale disconnects must be ignored
- late joins are allowed while a session is active; new participants start from the current snapshot with zero prior score
- session storage should support atomic session-scoped mutation semantics instead of socket-scoped partial writes
- the stable module doc should stay concise but include interface-first build steps and unit-test guard rails for the later implementation pass

## Rationale

- the active-session-per-`quizId` rule keeps join routing simple and deterministic for the challenge demo
- `sessionInstanceId` avoids ambiguity once the same `quizId` is reused for a later live run
- retaining participant state across short disconnects keeps reconnect in scope without tying correctness to socket lifetime
- explicit cleanup eligibility prevents accidental score loss from transient disconnects
- rejecting invalid reconnects preserves the server-owned identity model and reduces accidental state takeover
- a session-aggregate storage boundary is the cleanest way to preserve correctness under reconnect, duplicate submission, and cleanup races
- a short implementation handoff reduces re-discovery for the later build-focused agent without prematurely locking the stack

## Open Questions

- exact reconnect retention TTL and inactive-session cleanup thresholds `[needs verification]`
- whether the first implementation should delete closed sessions immediately or keep a short-lived tombstone `[questionable]`
- exact session phase model for quiz start, question progression, and final closure `[needs verification]`
- exact transport event names and payload boundaries that wrap these module results `[needs verification]`

## Follow-Up

- refine `docs/modules/realtime-transport.md` using the `quiz-session` contract as the upstream boundary
- define join, reconnect, disconnect, and snapshot event or command shapes
- define the shared session snapshot and error semantics needed by later scoring and leaderboard work
