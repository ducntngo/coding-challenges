# scoring-and-leaderboard.md

## Module Design: Scoring And Leaderboard

## Status

Stable first-pass module contract. This document defines the deterministic answer-processing, score-change, and leaderboard-ordering boundary. It keeps scoring logic separate from transport and session storage while making the implementation handoff concrete.

## Purpose

Own the deterministic decision logic for answer handling and leaderboard generation.

This module is responsible for:

- evaluating whether an answer attempt is accepted or rejected
- determining correctness and score delta for accepted submissions
- producing ordered leaderboard views from authoritative participant state
- exposing replaceable scoring and ranking policy boundaries
- returning transport-visible result shapes without embedding transport envelopes

This module is not responsible for:

- validating connection state or transport envelopes
- owning authoritative session persistence
- issuing participant identity or reconnect credentials
- deciding connection lifecycle behavior

## Relationship To Other Modules

- `quiz-session` owns authoritative participant state, answer markers, and current session or question context.
- `realtime-transport` owns command validation at the boundary and maps these results into outbound events.
- `observability-and-operations` should attach logs and metrics around accepted, rejected, and leaderboard-update paths.

## Core Rules

- scoring behavior must be deterministic
- one answer per participant per question remains the authoritative rule
- the first valid submission decides that participant-question outcome
- incorrect accepted submissions score zero
- correct accepted submissions score positively, with faster correct answers scoring higher
- leaderboard ordering must remain stable and documented
- duplicate, late, or otherwise invalid submissions must be handled explicitly

## Current First-Pass Policy

The current implementation uses a deliberately simple timing model behind the scoring seam:

- correctness still comes from quiz-definition answer data
- speed is measured from the server-observed question-open timestamp to the server-observed answer receive timestamp
- correct answers currently get a short full-score grace window and then linearly decay to a positive floor
- the exact timing constants should remain easy to tune behind the score policy without forcing transport or session-shape changes
- late-answer rejection still belongs to session or question context, not to the positive-score calculation itself

## Accepted Vs Rejected Submission Semantics

Use this distinction:

- `accepted`: the attempt is the first valid submission for that participant and question within the allowed session context
- `rejected`: the attempt must not mutate score or answer state

Important consequence:

- an accepted submission may still be incorrect and yield `scoreDelta = 0`
- duplicate submissions are rejected, not accepted-with-zero
- submissions for the wrong question or outside the allowed answer window are rejected

## Leaderboard Policy

Use a replaceable ranking policy.

Default ranking rules:

- higher total score first
- earlier participant creation or join order as the deterministic fallback tie-break

The ranking policy should stay separate from the score-calculation policy so either one can change later without rewriting the whole module.

## Suggested Inputs And Outputs

Keep the first implementation centered on:

- `AnswerAttempt`: participant identity, question reference, answer reference, server-observed receive time
- `ScoringContext`: current session or question context, quiz definition view, participant answer history, participant score state
- `SubmissionResult`: `accepted` or `rejected`, reason code, correctness if accepted, score delta, updated participant score, and whether leaderboard state changed
- `LeaderboardSnapshot`: ordered participant summaries suitable for direct transport mapping

## Result Rules

For each answer attempt, return one of these result paths:

- rejected with a stable reason code and no score mutation
- accepted and incorrect with zero score delta
- accepted and correct with positive score delta

After every accepted submission:

- update the participant score state
- recompute the ordered leaderboard snapshot
- return enough result data for transport to emit score and leaderboard events

After a rejected submission:

- do not mutate score state
- return enough result data for transport to emit a rejection event

## Design Rules

- keep score calculation pure or near-pure where possible
- keep ranking calculation pure where possible
- do not let transport concerns leak into scoring decisions
- do not let persistence concerns dictate the scoring interface
- prefer result objects that are easy to unit test and easy for transport to map into events

In a real deployment, accepted-answer results and leaderboard changes would often also be copied into longer-lived storage and analytics systems. That might mean an operational SQL database for auditability, replay, and live leaderboard retrieval, plus a warehouse such as BigQuery for aggregate analysis. BigQuery or a similar warehouse should be treated as a downstream analytics sink rather than the serving path for live leaderboard reads. If the architecture grows beyond a single process, score aggregation and ranking updates would ideally be fanned out through a near-real-time stream or queue consumer, such as Kafka or an equivalent managed event backbone, while the serving-side leaderboard state remains in an operational read model.

## Suggested Interface Shape

Keep the first implementation centered on:

- `ScorePolicy`: computes correctness and score delta for an accepted attempt
- `RankingPolicy`: orders participant summaries into a leaderboard
- `SubmissionEvaluator`: turns `AnswerAttempt` plus `ScoringContext` into a `SubmissionResult`
- `LeaderboardProjector`: derives the current ordered leaderboard from authoritative participant state

## Implementation Handoff

Build this module in this order:

1. Define the result types, reason codes, policy interfaces, and transport-neutral leaderboard summary shape first.
2. Add unit tests for correct answer scoring, incorrect answer zero scoring, duplicate rejection, late or wrong-question rejection, and deterministic leaderboard ordering.
3. Implement submission evaluation before ranking projection.
4. Keep the scoring and ranking policies separate so the exact score formula can change later without rewriting the full answer flow.

## Open Questions

- whether the current grace window, decay window, and positive floor should remain unchanged for the final submission `[questionable]`
- exact rejection code set for late, duplicate, and invalid-question submissions `[needs verification]`
- whether transport needs both incremental score updates and full leaderboard snapshots after every accepted answer `[questionable]`
