# 05-testing-and-submission.md

## Implementation Plan 05: Testing And Submission

## Status

Active draft. The early automated headless integration harness now exists, covers accepted answer flow plus session-wide score and leaderboard fanout, and should deepen as scoring and answer-validation behavior become real.

Current scenario reference:

- `docs/implementation/headless-integration-scenario.md`

## Goal

Finish verification, documentation, and submission-ready packaging.

## Deliverables

- automated tests
- an automated headless integration test scenario that simulates multiple players across concurrent sessions without a full frontend
- manual demo instructions
- AI collaboration documentation
- final architecture and implementation notes

## Detailed Steps

1. Add tests for scoring, ranking, and session behavior.
2. Keep the headless integration harness running against the real transport boundary.
3. Drive multiple simulated players across concurrent quiz sessions through the real transport boundary.
4. Stub or mock unfinished answer, scoring, or leaderboard behavior behind the existing interfaces until those modules are ready.
5. Expand the same harness as answer handling and leaderboard updates become real.
6. Add assertions for duplicate, late, and wrong-question rejection once question-phase validation exists.
7. Keep the scenario headless and code-driven instead of building a full frontend for test coverage.
8. Keep unit and integration suites separated so fast feedback and deeper end-to-end coverage can evolve independently.
9. Treat the existing integration harness as the canonical place for new multi-client and cross-session scenarios instead of creating disconnected one-off flows.
10. Add a simple local multi-client demo flow.
11. Write the AI collaboration document with prompts, tasks, and verification steps.
12. Tighten README instructions.
13. Review the repository from a submission perspective.

## Exit Criteria

- reviewer can run the project and tests from docs alone
- reviewer can run an automated headless multi-player and multi-session integration test scenario from docs alone
- AI usage is clearly documented
- repository supports the final 5 to 10 minute walkthrough
