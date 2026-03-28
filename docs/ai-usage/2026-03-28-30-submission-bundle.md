# 2026-03-28-30-submission-bundle.md

## AI Usage Log: Submission Bundle

## Date

2026-03-28

## Timestamp

2026-03-28T16:58:00+07:00

## Related Context

- Branch: `docs/submission-bundle`
- Related commit: `[docs] Add submission bundle`

## User Input And Decisions

- asked to begin Stage 7 by reviewing the top-level README for missing submission-facing material
- suggested bundling the submission into a folder containing the required information and links to the deeper docs
- preferred a reviewer-friendly package rather than leaving the repo navigable only through the implementation-era `docs/` structure

## Task Summary

Replaced the top-level README prompt-style content with a reviewer-facing repository entrypoint and added a `submission/` bundle containing a concise design summary and AI collaboration summary. Updated the trackers so Stage 7 reflects that the repository now has a coherent submission-facing package instead of only implementation-era working docs.

## AI Tools Used

- Codex

## Interaction Summary

AI was used to:

- compare the challenge requirements in the old top-level README against the current repo state
- identify that the missing artifact was a curated reviewer package rather than more implementation detail
- draft the submission bundle so it summarizes the required information while linking to the canonical technical docs instead of duplicating them heavily

## Outputs Influenced By AI

- updated `README.md`
- added `submission/README.md`
- added `submission/SYSTEM_DESIGN.md`
- added `submission/AI_COLLABORATION.md`
- added `scripts/simulate-game.ts`
- added `scripts/simulate-random-game.ts`
- added `scripts/support/simulation-client.ts`
- updated `src/app/dependencies.ts`
- updated `docs/PROJECT_PLAN.md`
- updated `docs/IMPLEMENTATION_STATUS.md`
- updated `docs/implementation/06-demo-flow.md`
- updated `docs/implementation/05-testing-and-submission.md`
- this AI usage log entry

## Verification And Refinement

- manually compared the new submission bundle against the challenge requirements listed in the previous top-level README
- kept the submission docs concise and link-oriented so the repo still has a single canonical source for detailed architecture and module information
- avoided adding more runtime code because Stage 7 is packaging work, not another implementation phase
- clarified the reviewer shortcut after a real reviewer-path failure where `nvm run bootstrap` was misread from the setup flow; the docs now explicitly distinguish `nvm use` from `npm run bootstrap`
- added a narrow running-server simulation script after identifying that reviewers may want a command that exercises a live local `npm run dev` server without relying only on the in-test server bootstrap
- added a local-only randomized multi-round simulator after the review flow would benefit from a more human-readable game narrative without widening the public transport contract with a host progression command
- expanded the submission-facing system design doc so it discusses the current challenge-sized build separately from the likely production path for databases, coordination, messaging, read models, observability, and analytics

## Human Judgment Applied

- chose a top-level `submission/` directory so reviewers can find the final package immediately
- chose to rewrite the root README into a submission entrypoint rather than preserving the upstream prompt verbatim
- chose to keep the detailed AI diary in `docs/ai-usage/` and provide only a condensed summary in the submission bundle

## Follow-Up

- run a final markdown and link sanity check
- merge the submission bundle PR
