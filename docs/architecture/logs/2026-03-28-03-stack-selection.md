# 2026-03-28-03-stack-selection.md

## Architecture Working Log: Stack Selection

## Date

2026-03-28

## Timestamp

2026-03-28T14:08:00+07:00

## Session Goal

Select the initial implementation stack for stage 3 so CI setup and interface scaffolding can start without reopening earlier architecture questions.

## Chosen Stack

- runtime: Node.js LTS
- language: TypeScript
- package manager: npm
- HTTP shell: Fastify
- WebSocket integration path: `@fastify/websocket`
- test baseline: `node:test`
- CI baseline: GitHub Actions

## Key Reasons

- the module docs already assume explicit interfaces and transport-neutral result shapes, which map cleanly into TypeScript
- the challenge scope fits a single backend process with in-memory state behind interfaces, which Node.js handles well
- Fastify gives a clean boundary for health routes, startup wiring, and later plugin separation without making the domain framework-heavy
- `@fastify/websocket` keeps the realtime boundary close to the documented command and event envelope model
- `node:test` keeps the first guard-rail tests close to the runtime and avoids unnecessary dependency weight
- GitHub Actions is enough for the first CI pass and fits the repository hosting model directly

## Tradeoffs Accepted

- more explicit message and connection handling must be written by hand than in a higher-level realtime framework
- this choice narrows future implementation flexibility earlier, but the design phase is complete enough that the benefit now is faster, clearer delivery
- the first implementation remains single-process in practice while state is only in memory

## Follow-Up

- add a simple CI workflow for install, typecheck, and unit tests
- settle the small set of scaffold-affecting payload and health-surface details
- scaffold the application shell and module interfaces before deep behavior work
