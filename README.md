# README.md

## Real-Time Quiz Submission

This repository contains a submission-ready backend implementation for the Real-Time Vocabulary Quiz coding challenge. The implemented component is a Fastify plus WebSocket real-time quiz session service that supports:

- join by `quizId`
- real-time answer submission
- real-time score updates
- real-time leaderboard fanout
- reconnect handling
- deterministic scoring and progression behavior

If you only review one area first, start with [submission/README.md](submission/README.md).

## Quick Start

Use `nvm` only to select Node. Use `npm` to run repository scripts.

1. `nvm install`
2. `nvm use`
3. `npm run bootstrap`
4. `npm run dev`
5. `curl http://127.0.0.1:3000/health`
6. `npm run simulate:game`
7. `npm run test:integration`

Do not use `nvm run bootstrap`; that asks Node to execute a file named `bootstrap` instead of the package script.

Full reviewer guidance is in [06-demo-flow.md](docs/implementation/06-demo-flow.md).

`npm run simulate:game` connects to the running local server over `/ws`, joins several players into `demo-quiz`, submits one answer, and verifies each player's observed score plus leaderboard events from the outside.

For a broader local-only run, `npm run simulate:random-game` boots its own temporary app instance, picks 2 to 5 players, uses simulated question timing across 3 rounds with random answers, keeps the leaderboard printed throughout, and shows one random participant's point of view.

Verification paths:

- `npm run simulate:game`
  - requires a running `npm run dev` server and is the best black-box runtime check
- `npm run simulate:random-game`
  - starts its own temporary app instance and gives a more human-readable terminal game narrative
- `npm run test:integration`
  - remains the authoritative deterministic end-to-end coverage path

If Node.js `24.x` is temporarily unavailable for a local-only check, you may bypass the version gate once with `SKIP_NODE_VERSION_CHECK=1 npm run bootstrap`. CI and merge readiness still depend on Node.js `24.x`.

## Submission Bundle

The submission-focused entrypoints are grouped under `submission/`:

- [submission/README.md](submission/README.md)
  - reviewer checklist and navigation
- [submission/SYSTEM_DESIGN.md](submission/SYSTEM_DESIGN.md)
  - concise system design summary with diagram, data flow, stack choices, and tradeoffs
- [submission/AI_COLLABORATION.md](submission/AI_COLLABORATION.md)
  - AI collaboration summary, verification approach, and links to the detailed diary entries

## Repository Map

- `src/`
  - implementation of the real-time quiz service
- `test/`
  - unit and headless integration coverage
- [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md)
  - stable architecture baseline
- [docs/architecture/TRADEOFFS.md](docs/architecture/TRADEOFFS.md)
  - explicit architecture tradeoffs
- [docs/modules/](docs/modules/)
  - stable module contracts
- [docs/implementation/](docs/implementation/)
  - implementation-phase docs, run flow, and harness walkthrough
- [docs/ai-usage/](docs/ai-usage/)
  - detailed commit-oriented AI usage diary

## Reviewer Path

1. Read [submission/README.md](submission/README.md).
2. Read [submission/SYSTEM_DESIGN.md](submission/SYSTEM_DESIGN.md).
3. Run the commands in the Quick Start section.
4. Use [submission/AI_COLLABORATION.md](submission/AI_COLLABORATION.md) and [docs/ai-usage/](docs/ai-usage/) if you want the detailed AI trail.
