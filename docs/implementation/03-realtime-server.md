# 03-realtime-server.md

## Implementation Plan 03: Real-Time Server

## Status

Placeholder draft. The sequence is provisional and should be refined before implementation starts.

## Goal

Implement the transport layer and join flow for quiz participation.

## Deliverables

- connection handling
- join event handling
- session lookup or creation
- outbound join acknowledgement and initial leaderboard snapshot

## Detailed Steps

1. Start the real-time server.
2. Accept and validate join requests.
3. Associate connections with participants and sessions.
4. Return initial session state to the client.
5. Handle disconnect cleanup.

## Exit Criteria

- multiple clients can join the same quiz ID
- session membership is tracked correctly
- disconnect behavior is reasonable and documented
