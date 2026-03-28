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
- Stable module docs should stay concise but include enough implementation handoff detail that a later agent can build without re-deriving the core flow.
- Keep module docs aligned with the stable architecture baseline and canonical tradeoffs.

## Current Sequence

| Order | Module | Status | Notes |
| --- | --- | --- | --- |
| 1 | quiz-session | Completed | Stable first-pass contract now covers session lifecycle, participant lifecycle, reconnect retention, cleanup eligibility, and store boundary. |
| 2 | realtime-transport | Completed | Stable first-pass contract now covers connection lifecycle, command or event envelopes, validation boundary, error codes, and snapshot mapping. |
| 3 | scoring-and-leaderboard | Completed | Stable first-pass contract now covers accepted-vs-rejected answer semantics, score mutation boundary, ranking policy integration, and leaderboard result shapes. |
| 4 | observability-and-operations | Completed | Stable first-pass contract now covers minimum logs, metrics, health signals, correlation fields, and challenge-vs-design-only operational expectations. |

## Current Focus

Current focus: first full module-design pass completed

The module-design phase is complete enough to hand off into stack selection and interface scaffolding. Remaining tagged items are now tracked as follow-up decisions rather than blockers for another module pass.

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
- the doc includes a short interface-first build order and initial unit-test guidance
- open decisions are short, explicit, and intentional
- related working-log context exists for later review

## Next Recommended Steps

1. Move to stack selection.
2. During stage 3, settle the remaining interface-shape items that affect scaffolding.
3. Scaffold all planned interfaces, mocks, and placeholder integrations.
4. Add skeletal tests before deep implementation work.

## Resume Point

If work pauses mid-stage, resume here:

- active focus: stack selection and interface scaffolding prep
- next topic: choose the runtime, transport approach, and project structure
- follow-up topics: finalize payload-shape and health-surface details that affect the scaffold
