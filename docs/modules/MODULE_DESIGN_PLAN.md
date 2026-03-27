# MODULE_DESIGN_PLAN.md

## Module Design Plan

## Status

This is the active tracker for the module-design phase. It should show which module is currently being refined, what order the module work follows, and what remains blocked or open.

## Purpose

This document translates the stable architecture baseline into an ordered module-design workflow. It is the module-level equivalent of the project plan, but scoped to design rather than implementation.

## Design Workflow Rules

- Each module should have a stable design doc under `docs/modules/`.
- Each module should accumulate reasoning and revisions in `docs/modules/logs/`.
- High-risk module decisions should be presented explicitly for review before they are treated as settled.
- Lower-risk details can be chosen pragmatically and documented afterward.
- Keep module docs aligned with the stable architecture baseline and canonical tradeoffs.

## Current Sequence

| Order | Module | Status | Notes |
| --- | --- | --- | --- |
| 1 | quiz-session | Pending | Define session lifecycle, participant lifecycle, reconnect ownership, and state boundaries. |
| 2 | realtime-transport | Pending | Define connection semantics, inbound/outbound events, validation boundaries, and error shapes. |
| 3 | scoring-and-leaderboard | Pending | Define scoring policy integration, ranking policy boundaries, and leaderboard update flow. |
| 4 | observability-and-operations | Pending | Define logs, health visibility, metrics, and operational expectations. |

## Current Focus

Current module target: `quiz-session`

## Why This Order

- session design is the center of the runtime model
- transport depends on session and identity semantics
- scoring depends on submission and session semantics
- observability should follow the finalized runtime flows

## Module Exit Criteria

A module doc is considered stable enough for the next stage when:

- the module responsibility boundary is clear
- the main inputs and outputs are explicit
- the important invariants and error cases are documented
- open decisions are short, explicit, and intentional
- related working-log context exists for later review

## Next Recommended Steps

1. Create the first module working-log entry for the module-design phase.
2. Refine `docs/modules/quiz-session.md`.
3. Log the decisions and open questions that result from that pass.
4. Move to `docs/modules/realtime-transport.md` only after the session module boundary is stable.
