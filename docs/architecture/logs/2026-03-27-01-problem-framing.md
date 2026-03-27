# 2026-03-27-01-problem-framing.md

## Architecture Working Log: Problem Framing

## Date

2026-03-27

## Session Goal

Capture the initial architecture framing before refining the stable architecture document.

## Problem Definition

The challenge is not to build a full quiz product. The target problem is to design and implement one core real-time component that proves these behaviors:

- users can join a quiz session by `quizId`
- users can submit answers
- scores update correctly in real time
- leaderboard updates are pushed in real time

The likely implementation target remains a backend real-time quiz server. Other parts of the product can be mocked for the challenge.

## Why This Problem Is Interesting

The core difficulty is not CRUD or persistence. The important architecture concerns are:

- coordinating session state
- handling multiple participants in the same quiz
- keeping scoring behavior deterministic
- keeping leaderboard updates consistent
- separating demo implementation choices from production-oriented design discussion

## Stated Constraints

The challenge explicitly requires:

- real-time quiz participation
- real-time score updates
- real-time leaderboard updates
- one core component to be implemented
- the rest of the system can be mocked
- discussion of scalability, performance, reliability, maintainability, and observability
- documentation of AI collaboration

## Missing Constraints

The challenge does not specify:

- target scale numbers
- latency targets
- expected number of quiz sessions
- expected number of concurrent participants
- persistence requirements
- authentication requirements
- reconnect behavior
- anti-cheat rules
- exact scoring formula
- frontend requirements
- transport technology
- deployment environment

## Working Assumptions

Current working assumptions:

- the implemented component will be the backend real-time quiz server
- quiz definitions can be mocked or seeded
- in-memory session state is acceptable only as a provisional implementation assumption for the challenge `[questionable]`
- participant identity can be simplified for the demo
- leaderboard scope is per quiz session
- score and leaderboard updates happen immediately after accepted submissions
- production-scaling discussion will be addressed in design, not necessarily in the code implementation

## State Management Note

The in-memory state assumption is intentionally provisional. It is acceptable for early implementation planning, but it may need to be replaced by a proper database or shared state layer later if persistence, multi-instance coordination, recovery, or stronger consistency guarantees become important to the final solution. `[needs verification]`

## Assumptions To Resolve Later

- whether in-memory state remains sufficient for the final implementation or should be replaced by a database-backed or shared-state approach
- the tie-break rule for equal scores
- whether submission order affects score or ranking

## Architectural Direction

Initial direction:

- keep transport concerns separate from domain logic
- isolate session management from scoring and ranking logic
- keep the implementation small and deterministic
- accept in-memory state only as a tentative implementation starting point
- explain a production path involving shared state and fan-out mechanisms later

## Implementation Boundary Decision

Current decision:

- implement one core component: the real-time quiz session service

That component owns:

- joining a quiz session by `quizId`
- tracking active participants in a session
- receiving answer submissions
- validating submissions against quiz or question data
- updating score state
- computing leaderboard state
- broadcasting score and leaderboard updates in real time
- returning clear errors for invalid actions
- minimal operational visibility needed for local development and design discussion

## Explicitly Mocked Or Out Of Scope

Current out-of-scope list:

- authentication and authorization
- user profile or account system
- quiz authoring or admin tooling
- rich frontend application
- long-term analytics pipeline
- payment or subscription concerns
- advanced anti-cheat behavior beyond basic validation
- quiz discovery or matchmaking beyond joining by `quizId`
- full production deployment infrastructure

## Working Behavior Decisions

Current working decisions:

- quiz definitions can be mocked or seeded
- leaderboard scope is per quiz session
- score and leaderboard updates happen immediately after an accepted submission
- each participant should be treated as answering within a single session context
- participant identity is server-issued and session-scoped, not authenticated
- reconnect remains in scope and should be supported in a limited way
- reconnect uses a server-issued opaque resume token bound to the participant and quiz session
- only one active connection per participant should be allowed at a time `[needs verification]`
- if the same participant rejoins, the latest connection should replace the prior one `[needs verification]`
- each participant may submit only one answer per question
- subsequent answers for the same participant and question should be rejected by the server
- client or demo UI should not offer repeat answering once a question has already been answered
- leaderboard tie-break behavior still needs to be explicitly finalized `[needs verification]`

## Identity And Reconnect Decision

Current decision:

- the server is the authority for participant identity
- the client may provide presentation data such as `displayName`, but not the authoritative participant identifier
- the server issues `participantId`
- the server also issues an opaque random resume token after a successful join
- reconnect should remain in scope for the challenge
- reconnect is limited, session-scoped resume behavior rather than full authenticated identity recovery
- reconnect validation should be based on the server-issued token and the quiz session context

## Identity And Reconnect Rationale

Reasoning behind the current decision:

- client-defined authoritative identity is too easy to spoof or collide
- server-issued identity creates a cleaner ownership model for score and leaderboard state
- limited reconnect improves demo resilience without requiring a full authentication system
- an opaque server-issued token is easier to reason about and later migrate to a database or shared-state design
- the reconnect model remains intentionally lightweight because the challenge does not require full account recovery or auth workflows

## Answer Submission Decision

Current decision:

- each participant may answer a given question only once
- the first accepted submission is the only valid submission for that participant-question pair
- any subsequent submission for the same participant and question should be rejected by the server
- the client or demo UI should also prevent repeat submission, but server enforcement remains authoritative

## Answer Submission Rationale

Reasoning behind the current decision:

- this keeps scoring deterministic
- it reduces ambiguity in leaderboard updates
- it simplifies session state and test design
- it matches the expected behavior of similar quiz-style products
- it prevents the UI from being the only enforcement layer while still allowing the UI to guide correct behavior

## Decision-Making Workflow Note

For architecture work, high-risk and hard-to-reverse decisions should be surfaced explicitly for user review before being treated as settled. Lower-risk technical details can be chosen pragmatically and documented afterward.

## Tradeoff Framing

The preferred challenge tradeoff is to optimize for clarity, correctness, and demo-readiness rather than broad feature scope. A simpler implementation with strong documentation is better than a wider feature set with weak guarantees.

## Status

These are early working notes. Nothing in this file should be treated as final architecture policy until reflected in `docs/ARCHITECTURE_PRINCIPLES.md` or the relevant module docs.

## Next Follow-Up

- refine `docs/ARCHITECTURE_PRINCIPLES.md` using this framing
- then expand module-level design docs with explicit assumptions and open questions
