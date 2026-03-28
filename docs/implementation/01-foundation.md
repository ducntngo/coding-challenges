# 01-foundation.md

## Implementation Plan 01: Foundation

## Status

Foundation scaffold implemented. This document now records the stage-3 baseline that exists in the repository and the handoff into the first participation-flow slice.

## Goal

Establish the initial runnable backend foundation for the real-time quiz service using the selected stack.

## Selected Stack

- runtime: Node.js LTS
- language: TypeScript
- package manager: npm
- HTTP server shell: Fastify
- real-time transport adapter: `@fastify/websocket`
- wire protocol: explicit JSON command and event envelopes over WebSocket
- state and quiz source: in-memory implementations behind interfaces
- unit-test baseline: `node:test`
- CI baseline: GitHub Actions

## Why This Stack

- TypeScript supports the interface-first design and explicit protocol contracts already defined in the module docs.
- Node.js keeps local development simple and fits the real-time server scope well.
- Fastify gives a small HTTP shell for health checks and structured plugin boundaries without dragging domain logic into framework code.
- `@fastify/websocket` keeps the real-time transport explicit while still fitting naturally into the Fastify app shell.
- `node:test` keeps the initial guard-rail test setup low-dependency and close to the runtime.
- GitHub Actions is the simplest CI baseline for this repository and is enough for install, typecheck, and unit-test checks.
- The in-memory state baseline avoids spending the challenge implementation budget on Redis, Kubernetes, ingress, NGINX, and database setup before the core realtime behavior is working and testable.

## Baseline In Repository

- project manifest, lockfile, `.nvmrc`, and TypeScript configuration
- shared onboarding command: `npm run bootstrap`
- lightweight GitHub Actions CI for `npm ci`, `npm run typecheck`, and `npm test`
- initial source tree with explicit module seams
- minimal Fastify app entrypoint
- `GET /health` returning `status`, `service`, and `timestamp`
- `GET /ws` WebSocket route placeholder with transport envelope handling
- mocked quiz-definition source and in-memory session-store adapter
- initial guard-rail tests for app health and transport bound-state rejection

## Suggested Project Shape

- `src/app/` for application bootstrap and composition
- `src/transport/` for Fastify and WebSocket boundary code
- `src/session/` for quiz-session interfaces and implementation
- `src/scoring/` for scoring and leaderboard policies
- `src/store/` for state access interfaces and in-memory implementation
- `src/observability/` for logging and health helpers
- `src/quiz-source/` for mocked quiz-definition access
- `test/` for unit and thin integration tests

## Detailed Steps

1. Read `AGENTS.md`, `CONTRIBUTING.md`, `docs/PROJECT_PLAN.md`, and `docs/IMPLEMENTATION_STATUS.md`.
2. Use Node.js `24.x` from `.nvmrc`.
3. Run `npm run bootstrap`.
4. Verify with `npm run typecheck`, `npm test`, and `npm run build`.
5. Start deeper implementation only behind the existing interfaces and tests.

## Onboarding Notes

Recommended local setup:

1. `nvm install`
2. `nvm use`
3. `npm run bootstrap`

Fallback for temporary local checks when Node.js `24.x` is unavailable:

- `SKIP_NODE_VERSION_CHECK=1 npm run bootstrap`

That fallback is local-only. CI remains the merge gate and runs on Node.js `24`.

## Exit Criteria

- project installs cleanly
- CI runs install, typecheck, and unit tests
- development entrypoint starts successfully
- health route and WebSocket entrypoint both exist
- structure supports later separation of modules
- interface seams exist before deeper module logic is added

Stage-3 exit criteria are now met.

## Open Follow-Ups

- implement `session.join` and the first success acknowledgement path
- implement reconnect and disconnect handling behind the same seams
- expand tests from scaffold guard rails into real participation coverage
