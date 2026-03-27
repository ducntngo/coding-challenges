# quiz-session.md

## Module Design: Quiz Session

## Status

Placeholder draft. This document defines an initial outline only and should be expanded later.

## Purpose

Manage quiz session lifecycle and participant membership.

## Responsibilities

- resolve or create an in-memory session by `quizId`
- allow participants to join a session
- track participant identity and connection association
- expose session state needed by scoring and leaderboard logic

## Core Concepts

- `QuizSession`
- `Participant`
- `ConnectionContext`
- `QuizDefinition`

## Input Operations

- participant joins by `quizId`
- participant disconnects
- participant reconnects or rejoins

## Output Events

- join acknowledged
- participant list or count updated
- current leaderboard snapshot sent after join

## Key Rules

- joining the same quiz ID should route users into the same active session
- participant identity rules must be explicit for the demo
- disconnect handling should avoid corrupting score state

## Open Design Questions

- whether `userId` is client-provided or server-generated for the demo
- whether reconnect semantics are supported or simplified
