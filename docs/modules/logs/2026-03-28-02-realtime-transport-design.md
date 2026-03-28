# 2026-03-28-02-realtime-transport-design.md

## Module Working Log: Real-Time Transport First Stable Pass

## Date

2026-03-28

## Timestamp

2026-03-28T07:12:24+0700

## Session Goal

Replace the placeholder `docs/modules/realtime-transport.md` outline with a stable first-pass module contract that defines connection state, command or event boundaries, validation responsibilities, and transport-visible error behavior.

## Decisions Logged

- each accepted connection gets a transport-level `connectionId` and starts unbound
- only session-binding commands are allowed before a connection is bound to a participant
- the first-pass transport contract uses explicit command and event envelopes instead of transport-specific callback semantics
- the initial inbound command set is `session.join`, `session.reconnect`, and `answer.submit`
- disconnect is a connection lifecycle event rather than an explicit client command
- the initial outbound event set includes bind acknowledgements, full snapshot sync, presence updates, score updates, leaderboard updates, and command rejection
- transport validation stops at envelope shape, required fields, and connection-state rules
- domain acceptance decisions such as reconnect legitimacy or duplicate-answer handling stay in the application layer
- `requestId` is preserved for correlation but does not provide transport-level deduplication in the first implementation

## Rationale

- explicit connection states keep join or reconnect behavior and answer submission rules simple
- a stable envelope shape makes later transport choice less important to the application contracts
- thin transport handlers reduce the risk of domain rules leaking into boundary code
- transport-visible error codes improve testing and client debugging without forcing early framework choices

## Open Questions

- whether `participant.score.updated` is still needed once the final `leaderboard.updated` payload is settled `[questionable]`
- exact snapshot field list for current-question context and answer submission payloads `[needs verification]`
- whether a client-triggered snapshot request command is needed in the first implementation `[questionable]`

## Follow-Up

- refine `docs/modules/scoring-and-leaderboard.md`
- define accepted-answer flow and leaderboard update semantics
- settle the minimal result shapes that scoring returns to transport
