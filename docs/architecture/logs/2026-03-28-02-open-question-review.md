# 2026-03-28-02-open-question-review.md

## Architecture Working Log: Open-Question Review

## Date

2026-03-28

## Timestamp

2026-03-28T07:30:41+0700

## Session Goal

Review the tagged open questions after the first full pass through the architecture and module docs, then separate stack-blocking items from early-implementation items and intentional deferrals.

## Review Outcome

- no remaining open question is severe enough to block stack selection on architecture grounds
- the current architecture and module contracts are stable enough to move into stage 3
- several open questions should still be resolved during interface scaffolding or early implementation, but they do not require preemptive stack selection decisions

## Must Resolve During Stage 3 Or Early Implementation

- exact session phase model for quiz start, question progression, and final closure
- exact transport-visible payload fields for snapshots and answer-handling results
- exact rejection code set for late, duplicate, and invalid-question submissions
- exact minimum health signal surface once the runtime is chosen

## Intentional Deferrals

- exact positive scoring formula for correct answers
- exact reconnect retention TTL and inactive-session cleanup thresholds
- whether closed sessions are deleted immediately or kept briefly as tombstones
- whether incremental score updates are emitted separately from leaderboard updates
- whether a client-triggered snapshot request command is needed in the first implementation
- exact challenge-scope metric set versus design-only metric set
- whether leaderboard update logs include ordered summaries or only change counts
- exact future scalable backing store choice

## Rationale

- the remaining questions mostly sit behind policy, payload-shape, or operational-depth boundaries that can be handled after stack selection
- none of them currently imply a conflicting architecture direction or force a different component split
- keeping these items explicit reduces the risk of rediscovery during scaffolding

## Follow-Up

- move to stack selection
- during stage 3, settle the small set of open interface-shape items that affect scaffolding
- keep the intentional deferrals tagged until the relevant implementation stage
