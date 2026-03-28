# 01-foundation.md

## Implementation Plan 01: Foundation

## Status

Stable first-pass foundation plan. The implementation stack is selected, and the next work is to add simple CI, scaffold the project, and put the first interface seams in place before deeper module implementation.

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

## Deliverables

- project manifest and TypeScript configuration
- initial source tree with clear module seams
- minimal Fastify app entrypoint
- health route and WebSocket route placeholder
- mocked quiz-definition source and in-memory store interfaces
- simple CI workflow for install, typecheck, and unit tests
- starter run and test instructions

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

1. Initialize the Node.js and TypeScript project files, scripts, and directory structure.
2. Add a simple GitHub Actions workflow immediately after the stack scaffold exists.
3. Create the minimal Fastify app shell with startup and shutdown paths.
4. Add the initial health route and WebSocket route placeholder.
5. Define the first interfaces for session access, scoring, store access, and quiz-definition access.
6. Add in-memory and mocked implementations so the seams are live before deeper behavior is built.
7. Add the first `node:test` guard-rail tests around app startup, health route behavior, and interface-wiring seams.
8. Confirm the project installs, starts, and passes the initial CI checks locally.

## Exit Criteria

- project installs cleanly
- CI runs install, typecheck, and unit tests
- development entrypoint starts successfully
- health route and WebSocket entrypoint both exist
- structure supports later separation of modules
- interface seams exist before deeper module logic is added

## Open Follow-Ups

- exact version pins for Node.js, TypeScript, and core dependencies
- exact project scripts and formatting or linting baseline
- exact health endpoint response shape
