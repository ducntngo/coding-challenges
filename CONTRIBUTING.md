# CONTRIBUTING.md

## Purpose

This repository is for a coding challenge submission. Contributors, including AI assistants, should prioritize correctness, clarity, speed of review, and submission-readiness.

## Working Agreement

- Read `AGENTS.md`, `docs/PROJECT_PLAN.md`, and `docs/IMPLEMENTATION_STATUS.md` before making substantial changes.
- Align implementation with the architecture and module docs unless a change is intentionally approved and documented.
- Keep changes scoped and easy to review.
- Document meaningful design changes in markdown before or alongside implementation.
- Use trunk-based development with short-lived branches off `main`.

## Review And Merge Policy

- All commits must reach `main` through a pull request.
- Each pull request should represent one coherent unit of work.
- Use descriptive branch names with a type prefix such as `feat/`, `fix/`, `chore/`, or `docs/`.
- The repository uses squash merge, so each pull request should land as a single commit on `main`.
- While iterating on an open PR, prefer amending the existing branch commit rather than accumulating many commits.
- Do not merge direct commits to `main`.
- Every pull request must include at least one AI usage diary entry in `docs/ai-usage/`.
- Keep commit subjects easy to read and at or under 50 characters when practical.
- Put extra explanation in the commit body instead of overloading the subject line.

## Proposed Repository Workflow

1. Update or confirm the relevant design doc.
2. Implement one coherent slice.
3. Run the smallest useful verification commands.
4. Update implementation status.
5. Prepare the repo for the next contributor to continue without re-discovery.

## Code Standards

- Keep modules small and single-purpose.
- Separate domain logic from I/O and framework-specific code.
- Add tests for scoring, ranking, session state, and protocol handling.
- Favor deterministic behavior and explicit error handling.
- Delay final language and framework choices until the planned stack-selection stage unless a decision has already been documented.

## Documentation Standards

- Markdown docs are first-class project artifacts.
- Start each repository-authored markdown file with its own filename as the top heading.
- Use repository-relative paths in documentation instead of local absolute paths.
- Prefer Mermaid for diagrams in markdown so contributors can edit and review them in-repo.
- Use concise sections with clear ownership of purpose.
- Keep canonical information in one file and reference it elsewhere.
- Record major tradeoffs, especially those relevant to the interview discussion.
- Keep stable design guidance separate from working logs so draft reasoning and finalized principles are easy to distinguish.
- Keep module-design sequencing and current focus in `docs/modules/MODULE_DESIGN_PLAN.md`.

## Build And Test Expectations

This file establishes the expectation that the project must provide:

- a documented install command
- a documented local run command
- a documented test command
- a documented demo flow for the reviewer

These commands will be filled in once the implementation stack is finalized.

## Security Expectations

- Do not commit secrets, API keys, tokens, passwords, certificates, or other sensitive material.
- Prefer secure defaults and follow reasonable security standards during design and implementation.
- Review AI-generated suggestions for security implications before accepting them.

## AI Contributor Rules

- Clearly identify meaningful AI-assisted work in submission docs.
- Add or update a commit-level AI usage log in `docs/ai-usage/` when AI materially influenced the work.
- Ensure the PR includes diary coverage summarizing the AI-assisted work that shipped in that PR.
- These rules are tool-agnostic and apply to any AI assistant used during the project.
- Verify generated code with tests, manual inspection, and targeted debugging.
- Do not rely on AI output for concurrency, protocol, or state correctness without review.
- Update `docs/IMPLEMENTATION_STATUS.md` after meaningful progress so a new session can resume quickly.

## AI Usage Log Format

AI usage logs should be short markdown entries that capture:

- related commit or branch context
- objective of the work
- how AI was used
- what was accepted, changed, or rejected
- how the output was verified

These logs are intended to support both internal continuity and the final submission narrative.

For consistency, use the same broad structure as `docs/ai-usage/2026-03-27-01-doc-scaffolding.md`, while adapting the content to the specific PR.
