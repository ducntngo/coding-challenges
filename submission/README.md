# README.md

## Submission Bundle

This directory is the reviewer-facing bundle for the coding challenge submission. It does not replace the canonical technical docs in `docs/`; it packages the most important material in one place and links to the deeper references when needed.

## Start Here

Recommended review order:

1. [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md)
2. [../README.md](../README.md)
3. [../docs/implementation/06-demo-flow.md](../docs/implementation/06-demo-flow.md)
4. [AI_COLLABORATION.md](AI_COLLABORATION.md)

## Challenge Requirement Map

| Challenge Requirement | Submission Entry Point | Canonical Detail |
| --- | --- | --- |
| System design document | [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | [../docs/ARCHITECTURE_PRINCIPLES.md](../docs/ARCHITECTURE_PRINCIPLES.md), [../docs/architecture/TRADEOFFS.md](../docs/architecture/TRADEOFFS.md), [../docs/modules/](../docs/modules/) |
| Implement one core real-time component | [../README.md](../README.md) | `src/`, [../docs/IMPLEMENTATION_STATUS.md](../docs/IMPLEMENTATION_STATUS.md) |
| Run and test instructions | [../README.md](../README.md) | [../docs/implementation/06-demo-flow.md](../docs/implementation/06-demo-flow.md) |
| AI collaboration in design and implementation | [AI_COLLABORATION.md](AI_COLLABORATION.md) | [../docs/ai-usage/](../docs/ai-usage/) |
| Scalability, reliability, maintainability, observability discussion | [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | [../docs/ARCHITECTURE_PRINCIPLES.md](../docs/ARCHITECTURE_PRINCIPLES.md), [../docs/modules/observability-and-operations.md](../docs/modules/observability-and-operations.md), [../docs/architecture/TRADEOFFS.md](../docs/architecture/TRADEOFFS.md) |

## What Was Implemented

The implemented component is a backend real-time quiz session service. It owns:

- participant join by `quizId`
- reconnect and stale-disconnect handling
- answer submission validation
- deterministic scoring
- session-scoped leaderboard updates
- session-scoped real-time fanout through WebSocket

The rest of the product is intentionally mocked or left design-only.

## Reviewer Shortcut

If you want the fastest credible evaluation path:

Use `nvm` only to select Node. Use `npm` to run repository scripts.

1. `nvm install`
2. `nvm use`
3. `npm run bootstrap`
4. `npm run dev`
5. `curl http://127.0.0.1:3000/health`
6. `npm run simulate:game`
7. `npm run test:integration`
8. skim `submission/SYSTEM_DESIGN.md`

Do not use `nvm run bootstrap`; that tries to execute a file named `bootstrap` instead of the `package.json` script.

If Node.js `24.x` is temporarily unavailable, the repository supports a non-authoritative local fallback:

- `SKIP_NODE_VERSION_CHECK=1 npm run bootstrap`

That fallback is for local inspection only. The documented and CI-authoritative runtime remains Node.js `24.x`.

`npm run simulate:game` is the quickest live-server proof. It connects to the running local server over WebSocket, joins several players into `demo-quiz`, submits an answer, and verifies each player's observed score plus leaderboard events from the outside.

`npm run simulate:random-game` is an optional local-only exploratory script. It boots its own temporary app instance, uses simulated game time to drive 2 to 5 players across 3 timed questions with random answers, prints the leaderboard throughout, and logs one random participant's point of view.

## Verification Paths

Choose the path that matches how deeply you want to inspect the system:

| Command | Server Requirement | What It Proves | Best Use |
| --- | --- | --- | --- |
| `npm run simulate:game` | requires a separately running `npm run dev` server | real WebSocket join, accepted answer, passive fanout, and per-player event visibility against the public runtime | fastest black-box reviewer check |
| `npm run simulate:random-game` | starts its own temporary local app instance | multi-round terminal narrative with 2 to 5 players, simulated round timing, printed leaderboard after each change, and one random participant POV | exploratory local QC without a frontend |
| `npm run test:integration` | no pre-running server needed | authoritative headless end-to-end coverage, including multi-session isolation, duplicate rejection, late rejection, and progression snapshots | correctness verification and merge confidence |

Recommended choice:

- use `npm run simulate:game` first if you want the cleanest runtime-facing reviewer path
- use `npm run simulate:random-game` when you want a more readable terminal-only game narrative
- use `npm run test:integration` when you want the strongest deterministic proof

## Detailed References

- [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md)
- [../docs/IMPLEMENTATION_STATUS.md](../docs/IMPLEMENTATION_STATUS.md)
- [../docs/implementation/headless-integration-scenario.md](../docs/implementation/headless-integration-scenario.md)
- [../docs/modules/quiz-session.md](../docs/modules/quiz-session.md)
- [../docs/modules/realtime-transport.md](../docs/modules/realtime-transport.md)
- [../docs/modules/scoring-and-leaderboard.md](../docs/modules/scoring-and-leaderboard.md)
- [../docs/modules/observability-and-operations.md](../docs/modules/observability-and-operations.md)
