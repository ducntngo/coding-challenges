# 02-domain-and-protocol.md

## Implementation Plan 02: Domain And Protocol

## Status

Placeholder draft. The sequence is provisional and should be refined before implementation starts.

## Goal

Define the in-memory domain model and real-time event contract before deeper implementation.

## Deliverables

- type definitions for session and participant state
- event schema definitions
- scoring rules and tie-break rules

## Detailed Steps

1. Define session-related entities.
2. Define inbound and outbound events.
3. Specify payload fields and validation expectations.
4. Lock scoring and leaderboard ordering behavior.
5. Add focused tests for pure logic where possible.

## Exit Criteria

- domain concepts are explicit
- protocol is stable enough to implement against
- scoring behavior is testable without a live server
