# 2026-03-28-32-contract-comments-and-caveats.md

## AI Usage Log: Contract Comments And Caveats

## Date

2026-03-28

## Timestamp

2026-03-28T19:27:44+07:00

## Related Context

- Branch: `chore/comment-contracts-and-caveats`

## Task Summary

Create a separate PR that:

- updates the contributor rules to require comments on contract or interface seams
- requires comments on non-trivial or surprising code that explain why it behaves that way
- adds a focused comment pass across the current runtime seams and a few caveat-heavy implementations

## AI Tools Used

- Codex / GPT-based coding assistant in the local development environment

## Interaction Summary

AI was used to:

- identify the contract files that define the main runtime seams
- select the small set of runtime files where code behavior is non-obvious enough to justify comments
- draft concise comments aimed at parameters, outputs, caveats, and surprising behavior rather than obvious syntax

## Outputs Influenced By AI

- `AGENTS.md`
- `CONTRIBUTING.md`
- `src/transport/contracts.ts`
- `src/session/contracts.ts`
- `src/answer-submission/contracts.ts`
- `src/scoring/contracts.ts`
- `src/store/contracts.ts`
- `src/quiz-source/contracts.ts`
- `src/transport/session-connection-registry.ts`
- `src/transport/register-transport-routes.ts`
- `src/answer-submission/stub-answer-submission-service.ts`
- `src/session/stub-quiz-session-service.ts`
- `src/scoring/stub-scoring-service.ts`
- `docs/IMPLEMENTATION_STATUS.md`

## Verification And Refinement

- Read the main contract files before editing so the comments stayed aligned with the real boundaries.
- Focused comments on:
  - transport correlation and fanout caveats
  - internal versus transport-visible session fields
  - accepted-versus-rejected answer semantics
  - reconnect and stale-disconnect handling
  - server-observed timing in scoring
- Avoided adding comments that only restate obvious TypeScript syntax.
- Planned verification for this slice is `npm run typecheck`, since behavior should remain unchanged.

## Human Judgment Applied

- Chose to update both `AGENTS.md` and `CONTRIBUTING.md` so the rule is visible to AI assistants and human contributors in the same terms.
- Chose not to blanket-comment every file; the pass stays concentrated on contracts and the few tricky runtime paths where later readers are likely to ask "why is it done this way?"
- Chose to keep contract comments concise and close to the declaration instead of creating a separate doc that would drift.

## Follow-Up

- Review whether the same commenting rule should be applied to tests that encode subtle protocol assumptions.
- Keep future changes aligned with the new rule so contract seams and unusual behavior remain documented as the code evolves.
