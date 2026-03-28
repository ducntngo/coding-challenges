# README.md

## Real-Time Vocabulary Quiz Coding Challenge

## Overview

This repository is a submission for the Real-Time Quiz coding challenge. The implemented component is a backend real-time quiz session service for an English learning application. It focuses on the core runtime behavior needed for:

- joining a quiz by `quizId`
- real-time answer submission
- real-time score updates
- real-time leaderboard updates

The rest of the product surface is intentionally mocked or discussed only in design docs.

## Acceptance Criteria

1. **User Participation**:
   - Users should be able to join a quiz session using a unique quiz ID.
   - The system should support multiple users joining the same quiz session simultaneously.

2. **Real-Time Score Updates**:
   - As users submit answers, their scores should be updated in real-time.
   - The scoring system must be accurate and consistent.

3. **Real-Time Leaderboard**:
   - A leaderboard should display the current standings of all participants.
   - The leaderboard should update promptly as scores change.

## Challenge Requirements

The challenge asks for:

- a system design with architecture, components, data flow, and technology choices
- one implemented real-time core component
- explicit documentation of AI collaboration in design and implementation
- discussion of scalability, performance, reliability, maintainability, and observability

This repository answers that with:

- the implemented backend real-time quiz service in `src/`
- design and architecture docs in `docs/`
- a reviewer-facing submission bundle in `submission/`
- unit, integration, and simulation-based verification paths

## Reviewer Addendum

If you only review one area first, start with [submission/README.md](submission/README.md).

Submission entrypoints:

- [submission/README.md](submission/README.md)
  - reviewer checklist and navigation
- [submission/SYSTEM_DESIGN.md](submission/SYSTEM_DESIGN.md)
  - concise design summary, runtime flow, and scale discussion
- [submission/AI_COLLABORATION.md](submission/AI_COLLABORATION.md)
  - condensed AI collaboration summary with links to the detailed diary

Quick reviewer path:

1. `nvm install`
2. `nvm use`
3. `npm run bootstrap`
4. `npm run dev`
5. `curl http://127.0.0.1:3000/health`
6. `npm run simulate:game`
7. `npm run test:integration`

Verification options:

- `npm run simulate:game`
  - quickest black-box check against a running local server
- `npm run simulate:random-game`
  - local-only multi-round terminal narrative with leaderboard output throughout
- `npm run test:integration`
  - deterministic end-to-end verification path

Full reviewer guidance is in [docs/implementation/06-demo-flow.md](docs/implementation/06-demo-flow.md).
