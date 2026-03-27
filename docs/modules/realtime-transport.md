# realtime-transport.md

## Module Design: Real-Time Transport

## Status

Placeholder draft. This document defines an initial outline only and should be expanded later.

## Purpose

Define the communication layer between clients and the backend quiz component.

## Responsibilities

- accept client connections
- validate and route incoming events
- serialize outbound events
- isolate transport mechanics from domain logic

## Candidate Options

- raw WebSocket
- Socket.IO

## Recommendation

Prefer a transport with simple local development and low ceremony. Final selection should be driven by speed of implementation, clarity of protocol, and testability.

## Expected Inbound Events

- `join_quiz`
- `submit_answer`

## Expected Outbound Events

- `join_accepted`
- `score_updated`
- `leaderboard_updated`
- `error`

## Design Rules

- validate payload shape at the boundary
- normalize transport-level errors into clear application errors
- keep event names stable and human-readable

## Open Design Questions

- whether acknowledgements are explicit events or callback-style
- how strict payload validation should be for the challenge scope
