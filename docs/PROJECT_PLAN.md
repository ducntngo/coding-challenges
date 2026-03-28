# PROJECT_PLAN.md

## Project Plan

## Status

This is the active execution plan for the project. The core design docs are now stable, and this file should describe the current implementation sequence clearly enough for a new session to continue immediately.

## Goal

Deliver a submission-ready real-time quiz component and supporting documentation for the coding challenge.

## Recommended Scope

Implement the backend real-time quiz server as the primary component. Mock the rest of the system.

## Planning Principles

- Keep the scope tightly aligned with the challenge acceptance criteria.
- Prefer decisions that improve submission quality over extra product breadth.
- Separate design decisions from implementation decisions so the stack is chosen only after the functional boundary is clear.
- Once a module boundary is stable, document a short implementation handoff so a later agent can build with minimal rediscovery.
- After the design pass is stable, move into interface-first scaffolding before deep implementation work.
- After stack selection, add a simple CI pipeline before deeper implementation so the initial scaffold has an automated check path.
- Put all planned module seams in place early, using mocks or placeholders where downstream pieces are not ready yet.
- Add bare-bones tests as soon as the seams exist so they act as guard rails while implementations deepen.
- Once the headless integration harness exists, treat it as an evolving guard rail that must keep passing as runtime behavior grows.
- Expand the existing integration harness when new end-to-end scenarios become possible instead of creating disconnected scenario files for the same workflow.
- Treat the markdown docs as the planning surface and keep them synchronized with real progress.
- Preserve a clear AI-collaboration trail through diary entries and status updates.

## Success Criteria

- Users can join a quiz session by quiz ID.
- Users can submit answers in real time.
- Scores update accurately and consistently.
- Leaderboard updates are pushed in real time.
- The repository includes submission-quality design and AI collaboration documentation.

## Final Deliverables

- System design documentation with architecture, component responsibilities, data flow, tradeoffs, and scaling discussion
- One implemented real-time component that demonstrates the acceptance criteria
- Run and test instructions
- AI collaboration documentation backed by the working diary logs
- A repository structure that supports an interview walkthrough and demo

## Delivery Strategy

The project should progress in three layers:

1. Planning and design
2. Implementation and verification
3. Submission packaging and demo prep

Layer 1 is complete. The current focus is the early part of layer 2: keep the scaffold stable, keep CI lightweight, and deepen the first participation flow behind the existing interfaces.

Within layer 2, the implementation sequence should be:

1. choose the stack after the design and open-question review are stable
2. add a simple CI pipeline for the chosen stack
3. scaffold all core interfaces and module boundaries
4. mock or stub not-yet-implemented dependencies so the seams are live early
5. add skeletal tests around those seams as guard rails
6. deepen module implementations behind the existing interfaces

## Work Stages

| Stage | Status | Notes |
| --- | --- | --- |
| 0. Documentation and workflow setup | Completed | Governance docs, planning scaffold, AI diary rules, and repo workflow rules are in place. |
| 1. Refine design boundary and execution plan | Completed | Solution scope, execution sequence, and design workflow are now explicit. |
| 2. Define architecture and module contracts | Completed | Architecture baseline, stable first-pass module contracts, and the open-question review are complete. No remaining architecture blocker currently prevents stack selection. |
| 3. Select stack, add CI, and scaffold interfaces | Completed | The selected stack, lightweight CI, onboarding script, source tree, interface seams, in-memory or mocked adapters, and initial guard-rail tests are now in place. |
| 4. Add guard-rail tests and participation skeleton | Completed | Join, reconnect, disconnect, the first accepted `answer.submit` path, and the early headless integration harness are now in place behind the established interfaces. |
| 5. Implement scoring and leaderboard flow | Completed | Accepted answer handling emits session-wide score and leaderboard updates to the active connections in the same quiz session, non-open phases reject answers, snapshots carry the active question reference, internal progression advances that question, progression changes fan out transport-visible `session.snapshot` updates, the harness proves duplicate and late rejections stay connection-local, correctness comes from quiz-definition answer data, and the score seam applies a simple server-observed linear timing formula. |
| 6. Strengthen tests, demo flow, and observability hooks | Completed | The headless harness now covers multi-session fanout, late-answer rejection after progression, and deterministic slower-answer scoring through the real transport boundary. The runtime emits lightweight structured logs around joins, rejections, accepted answers, leaderboard updates, and progression snapshot fanout, and the reviewer-facing run flow is now documented without adding a dedicated frontend. |
| 7. Finalize submission package | Completed | The repo now has a reviewer-facing root README, a `submission/` bundle with an explicit system design summary and AI collaboration summary, a live-server simulation script for quick reviewer checks, an optional randomized local game simulator, and the underlying architecture, implementation, and AI diary docs linked from that package. |

## Stage Exit Criteria

### Stage 1 exit criteria

- solution boundary is explicit
- the implemented component is confirmed
- planning docs clearly distinguish current work from deferred work
- the list of unresolved design decisions is short and intentional

### Stage 2 exit criteria

- module responsibilities are explicit
- domain terms are defined
- event flow is clear enough to implement
- scoring and leaderboard behavior are documented
- production-scaling discussion is credible at a high level

### Stage 3 exit criteria

- project structure exists and can host the planned implementation cleanly
- stack choices are documented with rationale
- a simple CI pipeline exists for the chosen stack
- all planned module interfaces and composition seams are present
- mocks or placeholder integrations exist for unfinished dependencies
- the local run path is minimally functional at a scaffold level

### Stages 4 to 6 exit criteria

- skeletal tests exist before deep implementation and continue to evolve with the modules
- the real-time participation, scoring, and leaderboard flows are implemented
- behavior is covered by targeted tests or explicit verification
- an automated headless integration test exercises multiple players across concurrent sessions without requiring a full frontend
- the local demo path is reliable enough for walkthrough use

### Stage 7 exit criteria

- docs and code tell one coherent story
- AI usage is documented clearly
- a reviewer can understand, run, and assess the solution quickly

## Active Focus

Current stage: `7. Finalize submission package`

Immediate next outputs:

- keep the final submission package stable
- use the existing submission bundle and demo docs as the walkthrough spine
- use the live-server simulation script for quick reviewer-path sanity checks
- use the randomized local simulator when a human-readable multi-round walkthrough is more useful than the narrow reviewer shortcut
- limit further changes to bug fixes or genuine clarity problems
- keep `docs/IMPLEMENTATION_STATUS.md` aligned with the current implementation stage

## Current Next Steps

1. Run one last smoke pass on Node.js `24.x` immediately before submission if needed.
2. Keep the current simple linear scoring baseline and transport payloads stable unless a concrete submission bug appears.
3. Preserve the new running-server simulation plus the existing unit and integration suites as the reviewer and correctness guard rails.
4. Avoid widening scope now that the submission package is complete.

## Resume Point

The next session should resume from the completed submission package.

Read in this order:

1. `docs/PROJECT_PLAN.md`
2. `docs/IMPLEMENTATION_STATUS.md`
3. `docs/ARCHITECTURE_PRINCIPLES.md`
4. `docs/architecture/logs/2026-03-28-03-stack-selection.md`
5. `docs/architecture/logs/2026-03-28-02-open-question-review.md`
6. `submission/README.md`
7. `submission/SYSTEM_DESIGN.md`
8. `submission/AI_COLLABORATION.md`
9. `docs/implementation/06-demo-flow.md`

Resume with these implementation decisions first:

- treat the repository as submission-ready unless a real bug or clarity issue is found
- keep the current simple linear scoring policy and transport payloads stable unless a concrete bug forces a change
- use the submission bundle and existing integration harness as the canonical walkthrough assets
- use the live-server simulation script when a reviewer wants a quick check against `npm run dev`
- use the randomized local simulator when you want a round-by-round leaderboard narrative without adding a host-facing command
- prefer final smoke checks over further feature work

After the first full pass through the design docs:

- keep the open-question review outcome in view during scaffolding
- resolve only the tagged items that affect CI, interface seams, or early implementation
- leave only intentional deferred items open

With the foundation scaffold in place:

- keep all deeper work behind the existing interfaces
- expand tests before or alongside each new behavior slice
- keep the current integration harness passing as runtime behavior and stubs change
- add new multi-client and cross-session scenarios to the existing harness as they become possible
- keep unfinished downstream behavior mocked or stubbed until its turn arrives
- preserve the lightweight CI baseline while behavior grows

## Cross-Cutting Documentation

The following docs should be updated throughout the project, not only at the end:

- `docs/IMPLEMENTATION_STATUS.md` for current state and handoff
- `docs/ai-usage/` for commit-by-commit AI usage diary entries
- `docs/architecture/` for architecture reasoning, assumptions, and decision history
- `docs/modules/MODULE_DESIGN_PLAN.md` for module sequencing and current focus
- `docs/modules/logs/` for module-level working records as module design deepens

## Risks To Control Early

- Overscoping into a full product instead of one well-implemented component
- Mixing transport concerns with scoring logic
- Real-time behavior without deterministic tests
- Weak documentation of AI usage and verification
- Picking a stack before the design boundary is stable
- Allowing placeholder docs to look more final than they are

## Deferred Until Later

The following should not be optimized yet:

- richer formatting or linting setup than the first CI pass needs
- full project directory structure
- advanced production features beyond what the design discussion requires

## Decision Log

- Initial implementation target: backend real-time quiz server
- Documentation-first workflow chosen to support both implementation and final submission
- Stack selection intentionally deferred until after architecture and module-contract refinement
- Selected implementation stack: Node.js LTS, TypeScript, Fastify, `@fastify/websocket`, `node:test`, and GitHub Actions
- Shared environment onboarding path: `npm run bootstrap`
