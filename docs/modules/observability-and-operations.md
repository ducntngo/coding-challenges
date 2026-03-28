# observability-and-operations.md

## Module Design: Observability And Operations

## Status

Stable first-pass module contract. This document defines the minimum observability and operational expectations for the challenge implementation, while separating required challenge-scope signals from broader production-oriented discussion points.

## Purpose

Define how the component is observed, diagnosed, and discussed operationally.

This module is responsible for:

- defining the minimum structured logs needed to diagnose runtime behavior
- defining the minimum metrics and health signals worth exposing
- defining the correlation fields that make failures traceable across modules
- defining what is required in the challenge implementation versus what stays design-only

This module is not responsible for:

- changing session, transport, or scoring behavior
- choosing a specific logging, metrics, or tracing product
- forcing production-grade infrastructure into the challenge implementation

## Relationship To Other Modules

- `quiz-session` provides the lifecycle transitions that need logging and cleanup visibility.
- `realtime-transport` provides connection lifecycle and boundary-rejection events.
- `scoring-and-leaderboard` provides accepted, rejected, score-change, and ranking-update outcomes.

## Minimum Expectations For The Challenge

- log key session lifecycle events
- log connection bind, reconnect, disconnect, and stale-disconnect outcomes
- log accepted and rejected answer outcomes
- log score-change and leaderboard-update outcomes at a summary level
- expose at least one simple liveness or health signal if the chosen stack supports it naturally
- make common failure modes diagnosable without deep manual state inspection

## Correlation Fields

Use shared fields consistently where they exist:

- `quizId`
- `sessionInstanceId`
- `participantId`
- `connectionId`
- `requestId`
- command or event name
- rejection or failure code

## Minimum Log Events

The first implementation should emit structured logs for:

- session created
- session closed or cleanup-triggered
- participant joined
- participant reconnected
- participant disconnected
- stale disconnect ignored
- answer accepted
- answer rejected
- score updated
- leaderboard updated
- internal command handling failure

Keep payloads summary-oriented. The logs should explain what happened and why without dumping unnecessary full-state snapshots.

## Minimum Metrics And Health Signals

Useful first-pass metrics:

- active connections
- active sessions
- accepted answer count
- rejected answer count
- leaderboard update count
- internal error count

Useful first-pass health signals:

- foundation scaffold baseline: `GET /health` returning `status`, `service`, and `timestamp`
- later readiness signal if the implementation needs a stronger indication that it can accept connections and mutate live session state

## Failure Diagnosis Rules

The first implementation should make these cases easy to diagnose:

- join or reconnect rejected unexpectedly
- stale disconnect removed the wrong participant state
- duplicate or late answers are being misclassified
- leaderboard ordering looks incorrect after a score change
- state cleanup happens too early or too late

## Production-Oriented Discussion Points

- connection counts
- active sessions
- message latency
- broadcast failures
- score update throughput
- error rates by event type

In a real deployment, these signals would usually feed into concrete operational tools rather than staying abstract. A plausible stack would be Prometheus for metrics, VictoriaLogs or a similar centralized log system for runtime event retention and search, and an analytics warehouse such as BigQuery for longer-horizon product or behavioral analysis. Those concrete tooling choices are intentionally left out of the challenge implementation so the code stays submission-sized.

These are useful in the final design discussion even if the challenge implementation only exposes a smaller subset.

## Operational Risks

- noisy logs without correlation fields
- hidden session state bugs
- silent broadcast failures
- inability to reproduce leaderboard issues

## Suggested Interface Shape

Keep the first implementation centered on:

- a structured logger interface
- an optional metrics recorder interface
- small helper functions that map session, transport, and scoring outcomes into consistent log fields
- a simple health-check surface if the chosen runtime makes one natural

## Implementation Handoff

Build this module in this order:

1. Define shared log field names and the small logging or metrics interfaces first.
2. Add unit tests for log-field mapping where the helper logic is non-trivial.
3. Add logging hooks to session, transport, and scoring flows before adding richer metrics.
4. Keep the challenge implementation minimal, and leave richer production-oriented signals as follow-up discussion unless they come almost for free.

## Open Questions

- whether a separate readiness signal is needed once real session mutation is implemented `[questionable]`
- exact challenge-scope metric set versus design-only metric set `[questionable]`
- whether leaderboard update logs should include ordered summaries or only change counts `[questionable]`
