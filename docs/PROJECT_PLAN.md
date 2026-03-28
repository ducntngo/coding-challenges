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
| 4. Add guard-rail tests and participation skeleton | In progress | The first tests exist. Next deepen the usable participation flow behind the scaffolded interfaces, starting with session join and connection binding. |
| 5. Implement scoring and leaderboard flow | Pending | Deepen the stubbed scoring, ranking, and live update paths without breaking the established interfaces or guard-rail tests. |
| 6. Strengthen tests, demo flow, and observability hooks | Pending | Expand tests, improve the local multi-client demo path, and add logging plus developer run instructions. |
| 7. Finalize submission package | Pending | Final docs, AI collaboration summary, architecture diagram, and video preparation notes. |

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
- the local demo path is reliable enough for walkthrough use

### Stage 7 exit criteria

- docs and code tell one coherent story
- AI usage is documented clearly
- a reviewer can understand, run, and assess the solution quickly
- the repository supports the final video walkthrough

## Active Focus

Current stage: `4. Add guard-rail tests and participation skeleton`

Immediate next outputs:

- implement the first usable `session.join` flow behind the scaffolded interfaces
- bind successful joins to the connection context and emit the first success acknowledgement path
- expand tests around join success, join rejection, and bound-connection behavior
- keep the transport adapter thin while session behavior starts to deepen
- keep `docs/IMPLEMENTATION_STATUS.md` aligned with the current implementation stage

## Current Next Steps

1. Implement `joinSession` behind the existing session and store interfaces.
2. Map `session.join` to a successful transport acknowledgement plus the current snapshot.
3. Bind the connection context on successful join and cover that with tests.
4. Implement `session.reconnect` behind the same interfaces.
5. Add disconnect handling and the next transport guard-rail tests.

## Resume Point

The next session should resume with the first real participation slice behind the stage-3 scaffold.

Read in this order:

1. `docs/PROJECT_PLAN.md`
2. `docs/IMPLEMENTATION_STATUS.md`
3. `docs/ARCHITECTURE_PRINCIPLES.md`
4. `docs/architecture/logs/2026-03-28-03-stack-selection.md`
5. `docs/architecture/logs/2026-03-28-02-open-question-review.md`
6. `docs/modules/MODULE_DESIGN_PLAN.md`
7. `docs/modules/quiz-session.md`
8. `docs/modules/realtime-transport.md`
9. `docs/modules/scoring-and-leaderboard.md`
10. `docs/modules/observability-and-operations.md`

Resume with these implementation decisions first:

- implement the first accepted `session.join` path
- finalize the first join success payload shape
- update connection binding after join succeeds
- expand the guard-rail test set around the participation boundary

After the first full pass through the design docs:

- keep the open-question review outcome in view during scaffolding
- resolve only the tagged items that affect CI, interface seams, or early implementation
- leave only intentional deferred items open

With the foundation scaffold in place:

- keep all deeper work behind the existing interfaces
- expand tests before or alongside each new behavior slice
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
