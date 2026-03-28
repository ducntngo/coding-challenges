# 2026-03-28-31-scaling-review-docs.md

## AI Usage Log: Scaling Review Docs

## Date

2026-03-28

## Timestamp

2026-03-28T18:26:59+07:00

## Related Context

- Branch: `docs/system-design-scale-review`

## Task Summary

Refine the reviewer-facing design docs to explain two production scale cases more clearly:

- many simultaneous games with very large total user count
- one hotspot game with exceptionally large concurrent participation

Also restore the top-level `README.md` to challenge-first framing and keep repository-specific reviewer guidance as an addendum instead of making the whole file reviewer-centric.

Later in the same doc-focused slice, add concrete Mermaid flow charts to the reviewer-facing system design using the real module and function names from the current runtime.

## AI Tools Used

- Codex / GPT-based coding assistant in the local development environment

## Interaction Summary

AI was used to:

- compare the current top-level `README.md` with the upstream challenge prompt
- draft a clearer scaling discussion for `submission/SYSTEM_DESIGN.md`
- capture the supporting rationale in the stable architecture and foundation docs
- summarize the design-review changes in the implementation handoff doc

## Outputs Influenced By AI

- `README.md`
- `submission/SYSTEM_DESIGN.md`
- `docs/ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/TRADEOFFS.md`
- `docs/implementation/01-foundation.md`
- `docs/IMPLEMENTATION_STATUS.md`
- diagrams added inside `submission/SYSTEM_DESIGN.md` for join, accepted-answer fanout, and score or leaderboard visibility

## Verification And Refinement

- Reviewed the upstream `README.md` before restoring the top-level README shape.
- Refined the design summary so it now explicitly separates:
  - Kubernetes plus Redis session routing for many concurrent games
  - Redis-backed incremental ranking and participant-sharded processing for a hotspot mega-session
- Traced the real runtime call paths before diagramming them so the charts use concrete code names such as `registerTransportRoutes()`, `DefaultTransportCommandHandler.handleMessage()`, `StubQuizSessionService.joinSession()`, and `StubAnswerSubmissionService.submitAnswer()`.
- Added the scope-control rationale for the in-memory baseline so the docs explain that the challenge implementation intentionally did not stand up Redis, Kubernetes, ingress, or database infrastructure first.
- Updated the implementation status doc so later sessions can discover the design-review changes quickly.
- No code or behavior changed, so no test commands were run in this slice.

## Human Judgment Applied

- Chose to keep the top-level README challenge-first and move reviewer-specific guidance into an additive section rather than making the entire README a reviewer walkthrough.
- Chose to document two different scale regimes instead of presenting one generic "future scale" story, because many-session scaling and one-hotspot-session scaling have different bottlenecks and mitigation strategies.
- Chose to describe Kafka as downstream from authoritative answer acceptance rather than as the primary correctness path for live gameplay.

## Follow-Up

- Review the hotspot-game design more critically, especially fairness, tie-breaking, and how much fanout can remain truly realtime at very large scale.
- If these docs are kept, package them into a small docs PR rather than mixing them with unrelated code changes.
