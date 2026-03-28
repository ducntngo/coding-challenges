# TRADEOFFS.md

## Architecture Tradeoffs

## Status

This is the canonical summary of explicit architecture tradeoffs. It should be updated when major design choices are made, revised, or intentionally deferred.

## Purpose

This document collects the architecture tradeoffs that matter most to the solution. Unlike the working logs, it should stay concise and decision-oriented.

## Tradeoff 1: Scope Control Vs Product Breadth

### Choice

Implement one core real-time quiz session service instead of a full quiz product.

### Chosen Direction

Prefer a narrowly scoped backend component that owns session participation, answer handling, scoring, and leaderboard updates.

### Why

- directly satisfies the challenge acceptance criteria
- keeps implementation risk controlled
- preserves time for quality, testing, and design discussion

### Cost

- surrounding product concerns are mocked
- the solution is less product-complete than a full-stack demo

## Tradeoff 2: Simplicity Vs Full Authentication

### Choice

Use server-issued session-scoped participant identity and limited reconnect instead of real user authentication.

### Chosen Direction

Server issues `participantId` and opaque resume token. Client may provide `displayName`, but not authoritative identity.

### Why

- reduces spoofing compared with client-controlled identity
- keeps reconnect in scope without adding full auth complexity
- supports a cleaner future migration path to shared state or durable storage

### Cost

- reconnect is only limited session recovery
- this is not a real user-account model

## Tradeoff 3: Determinism Vs Richer Gameplay Complexity

### Choice

Prefer deterministic server-side scoring and ranking over more complex or client-influenced game mechanics.

### Chosen Direction

Use server-observed inputs and timing only. Equal inputs and equal server-observed timing should produce equal outcomes.

### Why

- easier to test and reason about
- reduces ambiguity in competitive behavior
- avoids client clock skew and manipulation

### Cost

- fewer game mechanics
- some product ideas are intentionally deferred

## Tradeoff 4: Single-Answer Rule Vs Multiple Attempts

### Choice

Allow one answer per participant per question instead of multiple attempts.

### Chosen Direction

First accepted submission counts. Subsequent submissions are rejected by the server and should also be prevented in the UI.

### Why

- keeps scoring deterministic
- simplifies state transitions
- matches expected quiz behavior

### Cost

- less flexibility for alternative game modes

## Tradeoff 5: Speed-Based Scoring Vs Simpler Fixed Scoring

### Choice

Reward faster correct answers with higher score instead of using correctness-only scoring.

### Chosen Direction

Incorrect answers always score zero. Correct answers score positively, and faster correct answers score higher.

### Why

- aligns with common competitive quiz expectations
- preserves correctness as the gate while still rewarding speed

### Cost

- requires authoritative timing semantics
- exact scoring curve still needs definition `[needs verification]`

## Tradeoff 6: Server Timing Vs Client Timing

### Choice

Use only server-side timestamps for speed scoring instead of client-provided timing data.

### Chosen Direction

Measure elapsed time from server-recorded broadcast time to server-recorded submission receive time.

### Why

- avoids client clock skew
- avoids client timestamp manipulation
- keeps scoring authority on the backend

### Cost

- timing reflects server-observed latency, not true user reaction time

## Tradeoff 7: In-Memory Implementation Vs Immediate Shared Storage

### Choice

Start with an in-memory implementation behind a storage interface instead of requiring a shared durable store or coordination layer immediately.

### Chosen Direction

All session and participant state access goes through a clear interface. The first implementation may be in-memory, but the architecture must support a later scalable backing store.

### Why

- reduces implementation complexity for the challenge
- keeps the domain model decoupled from storage details
- supports a migration path to a scalable shared or durable store later

### Cost

- a live session is effectively tied to one process while state is only local in memory
- multi-instance coordination for the same session is deferred
- scalable backing store choice remains open `[needs verification]`

## Tradeoff 8: Hardcoded Ranking Rules Vs Replaceable Ranking Policy

### Choice

Bake ranking behavior directly into core session logic, or isolate it behind a replaceable policy.

### Chosen Direction

Implement leaderboard ranking through a replaceable ranking policy. Use total score descending as the main rule and participant creation order as the default fallback tie-break.

### Why

- ranking behavior is a likely candidate for future tuning or experimentation
- a replaceable policy makes changes cheaper and safer
- the default fallback remains deterministic without overcommitting to one permanent product rule

### Cost

- adds a small amount of abstraction
- still leaves the exact long-term preferred ranking policy open

## Open Tradeoffs

- exact scoring formula for correct answers `[needs verification]`
