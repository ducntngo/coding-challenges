# 2026-03-27-05-architecture-next-decisions.md

## AI Usage Log: Architecture Next Decisions

## Date

2026-03-27

## Timestamp

2026-03-27T22:29:45+07:00

## Related Context

- Branch: `docs/architecture-next-decisions`

## Task Summary

Continue the architecture decision pass after merging the previous planning PR. Capture the next risky product and architecture decisions, add a canonical tradeoffs document, and refine the stable architecture baseline.

## AI Tools Used

- AI coding assistant in the local development environment

## Interaction Summary

AI was used to:

- resume from the latest merged planning state
- frame the remaining risky architecture decisions
- present options and tradeoffs for leaderboard and scoring behavior
- convert the selected product decision into explicit architecture log entries

## Outputs Influenced By AI

- `AGENTS.md`
- `docs/architecture/README.md`
- `docs/architecture/TRADEOFFS.md`
- `docs/ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/logs/2026-03-27-01-problem-framing.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ai-usage/2026-03-27-05-architecture-next-decisions.md`

## Verification And Refinement

- Treated scoring semantics as a product-level decision that still has architectural consequences.
- Logged the need for server-authoritative timing so score calculation does not depend on client clocks.
- Refined the timing origin so scoring is measured specifically from server-side broadcast time to server-side receive time.
- Elevated deterministic server-side scoring and ranking into a stable architecture principle.
- Logged the state-layer decision to require a storage interface with an initial in-memory implementation and a future scalable backing store.
- Logged the reconnect conflict policy and captured the limited UX downside of replacing an older connection with a newer valid one.
- Added a canonical architecture tradeoffs document so the main design choices are explicitly summarized in one place.
- Logged the decision to treat leaderboard ordering as a replaceable ranking policy with a simple default fallback tie-break.
- Refined `docs/ARCHITECTURE_PRINCIPLES.md` from a placeholder into the stable architecture baseline that will guide module design next.
- Added a Mermaid high-level architecture diagram and tightened timestamp guidance for future logs.
- Kept the exact scoring formula and final tie-break rule open rather than pretending they were settled.

## Human Judgment Applied

- Accepted the product direction that faster correct answers should score higher while incorrect answers always score zero.
- Accepted the constraint that timestamp origin must be server-side only at both ends of the timing window.
- Treated determinism as a top-level game principle rather than a minor implementation preference.
- Accepted the tradeoff of in-memory implementation now only if the domain accesses state through a clear replaceable interface.
- Accepted latest-valid-connection-wins as the reconnect policy because it improves recovery and continuity more than it harms expected UX.
- Accepted a replaceable ranking policy because leaderboard rules are likely to evolve more than core session behavior.
- Kept the exact formula open because the product intent is decided, but the scoring curve is still a design detail that needs later refinement.

## Follow-Up

- Open and merge the architecture-baseline PR for this branch.
- Refine module docs and protocol contracts next.
