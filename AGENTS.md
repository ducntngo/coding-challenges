# AGENTS.md

## Purpose

This file defines how AI assistants should work in this repository. It is the primary policy document for AI-assisted design, implementation, review, and handoff.

## Operating Principles

- Treat markdown docs in `docs/` as the source of truth before making code changes.
- Start new work from `main` after updating it with `git pull --rebase`.
- Read `CONTRIBUTING.md`, `docs/PROJECT_PLAN.md`, and `docs/IMPLEMENTATION_STATUS.md` at the start of every new session.
- Keep changes aligned with the challenge acceptance criteria: join quiz by ID, real-time score updates, and real-time leaderboard updates.
- Prefer small, verifiable increments over large speculative implementations.
- Keep the design submission-oriented: every major code decision should support the final write-up and demo.
- Treat this repository as trunk-based: short-lived branches should merge back to `main` quickly.

## Branch And Review Rules

- All changes must be submitted through a pull request before merging to `main`.
- Prefer one pull request per coherent slice of work.
- Use descriptive branch names with a type prefix such as `feat/`, `fix/`, `chore/`, or `docs/`.
- Pull requests should be squash-merged so each PR becomes one commit on `main`.
- While a PR is in progress, prefer amending the existing branch commit instead of stacking many commits.
- Keep branches short-lived and rebased or refreshed as needed to stay close to trunk.
- Every pull request must include at least one AI usage diary entry under `docs/ai-usage/`.
- Keep commit subjects easy to read and at or under 50 characters when practical.
- Use the commit body for additional detail when context is needed.

## Required Workflow

1. Read current status and active next steps.
2. Review the relevant module design docs before editing code.
3. Update design docs if implementation changes the plan materially.
4. Implement the smallest complete slice possible.
5. Verify with tests or other explicit checks.
6. Update `docs/IMPLEMENTATION_STATUS.md` with what changed, what is next, and any open risks.

## AI Usage Rules

- Explicitly document meaningful AI assistance in the final submission artifacts.
- Maintain commit-oriented AI usage logs under `docs/ai-usage/`.
- Keep the workflow tool-agnostic: these rules apply whether the work is assisted by Codex, ChatGPT, Claude, Gemini, Copilot, Cursor, or another AI tool.
- Do not present AI-generated code as trusted by default; validate behavior, edge cases, and failure modes.
- Prefer AI for drafting, brainstorming, refactoring proposals, and test case generation.
- Human or agent review is required for protocol design, state transitions, concurrency assumptions, and scoring correctness.
- When AI suggestions are rejected, record the reason if it affected architecture or implementation direction.
- For architecture work, present the reasoning and high-risk decision points to the user before locking them in.
- For module design work, present the reasoning and high-risk module decisions to the user before locking them in.
- Prioritize user decisions on choices that are hard to change, materially affect delivery risk, or have a high chance of causing failure if chosen poorly.
- For lower-risk technical details, choose the best pragmatic option and document it.
- Log each meaningful architecture decision in the relevant working log when it is made or revised.
- Log each meaningful module decision in the relevant module working log when it is made or revised.
- Add explicit tags such as `questionable` or `needs verification` when a decision or assumption is provisional, weakly supported, or still awaiting validation.

## AI Diary Requirement

- Create or update one markdown log entry for each meaningful commit or tightly related commit group.
- Ensure each pull request has diary coverage that explains the AI-assisted work included in that PR.
- Each entry should summarize:
  - scope of work
  - AI tools used
  - prompts or interaction style
  - artifacts produced with AI assistance
  - verification and refinement steps
  - unresolved concerns or follow-ups
- Keep entries concise but specific enough for interview review.
- Treat these logs as the raw material for the final AI collaboration write-up.
- Follow the same general shape as `docs/ai-usage/2026-03-27-01-doc-scaffolding.md`, adapted to the work in the PR.

## Documentation Rules

- Keep docs current with the codebase.
- Start each repository-authored markdown file with its own filename as the top heading.
- Use repository-relative paths in documentation; do not embed local machine-specific absolute paths.
- Avoid duplicating the same decision in many places; link or reference the canonical document instead.
- Use a stable-doc plus working-log pattern for evolving design areas.
- Prefer combined session-oriented working logs plus canonical summary docs over creating one file for every minor decision.
- Include explicit timestamps in working logs and decision records, using ISO 8601 with timezone when practical.
- Prefer Mermaid for diagrams in markdown so they stay easy to edit and review in the repository.
- Use `docs/PROJECT_PLAN.md` for roadmap and progress stages.
- Use `docs/IMPLEMENTATION_STATUS.md` for current snapshot and handoff context.
- Record architecture exploration and decisions in `docs/architecture/` so future sessions can recover context quickly.
- Record explicit architecture tradeoffs in `docs/architecture/TRADEOFFS.md` and keep that file current as major choices are made or revised.
- Use `docs/modules/MODULE_DESIGN_PLAN.md` to track module-design sequencing, status, and current focus.
- Record module-specific exploration and decisions in `docs/modules/` and `docs/modules/logs/` as those areas mature.
- Use module docs for stable design details and tradeoffs.
- Preserve decision history clearly enough that later sessions can see what was considered, what was decided, and what still needs verification.

## Coding Rules

- Optimize for clarity and maintainability over premature complexity.
- Do not lock in a tech stack prematurely; language, framework, and transport choices should be decided in the later planning stage.
- Keep external dependencies minimal unless they materially improve delivery speed or correctness.
- Make real-time events explicit and versionable.
- Preserve clear boundaries between transport, domain logic, and state management.
- Do not commit keys, secrets, tokens, credentials, or other sensitive material to the codebase.
- Prefer secure defaults and adhere to reasonable security standards in design and implementation decisions.

## Handoff Requirements

Every substantial work session should leave behind:

- updated status
- updated AI diary entry when AI materially affected the work
- changed decisions or assumptions
- updated architecture or module working log when design reasoning evolved
- commands used for verification
- known gaps or deferred work
