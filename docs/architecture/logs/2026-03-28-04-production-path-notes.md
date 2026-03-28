# 2026-03-28-04-production-path-notes.md

## Architecture Log: Production-Path Notes

## Date

2026-03-28

## Timestamp

2026-03-28T16:18:00+07:00

## Session Goal

Clarify in the stable architecture and module docs which challenge-sized implementation choices are intentionally temporary and what the likely real-world replacements would be.

## Decisions Logged

- keep the submission implementation minimal, but call out the expected production replacements explicitly in the stable docs
- document that in-memory session state is a challenge choice, not the intended long-term backing store
- document that single-process WebSocket fanout is a challenge choice, not the intended multi-instance transport model
- document that observability and analytics would normally land in dedicated metrics, logging, and warehouse systems

## Rationale

- the challenge implementation should stay small, but the design discussion should still show a credible path to production
- explicit replacement notes reduce the risk that reviewers mistake the current in-memory or mocked pieces for architectural end-state decisions
- these notes are easier to maintain in the stable docs than as repeated ad hoc comments elsewhere

## Follow-Up

- review the broader production-path tradeoffs later in a dedicated design pass instead of expanding this doc-only clarification into a larger architecture rewrite now
