# scoring-and-leaderboard.md

## Module Design: Scoring And Leaderboard

## Status

Placeholder draft. This document defines an initial outline only and should be expanded later.

## Purpose

Handle answer evaluation, score mutation, ranking, and leaderboard snapshots.

## Responsibilities

- evaluate submitted answers
- update participant scores consistently
- produce ordered leaderboard views
- broadcast score and ranking changes

## Core Rules

- scoring behavior must be deterministic
- leaderboard ordering must be stable and documented
- duplicate or invalid submissions must be handled explicitly

## Recommended Approach

- keep scoring logic pure where possible
- compute leaderboard from participant state after every accepted score change
- define deterministic tie-breaking rules early

## Example Tie-Breaking Options

- higher score first, then earlier correct submission time
- higher score first, then participant join order
- higher score first, then lexical participant ID

## Testing Priorities

- correct answer increases score
- incorrect answer does not incorrectly increase score
- repeated submissions follow documented behavior
- leaderboard ordering is deterministic

## Open Design Questions

- exact score model
- whether multiple answers per question are allowed
- how to treat late answers or duplicate answers
