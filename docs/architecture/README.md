# README.md

## Architecture Working Records

## Purpose

This directory keeps architecture context that may evolve across sessions. It exists so design reasoning is not lost between AI sessions, PRs, or later changes in direction.

## Structure

- `docs/ARCHITECTURE_PRINCIPLES.md`
  - Stable architecture guidance and durable design principles
- `docs/architecture/logs/`
  - Session-by-session architecture working logs

## What Goes In The Logs

Use architecture logs to record:

- problem framing
- assumptions
- constraints and missing constraints
- options considered
- tradeoffs discussed
- tentative decisions
- final decisions or reversals
- open questions for later sessions
- explicit tags such as `questionable` or `needs verification` where confidence is low or validation is pending

## Logging Rule

Whenever architecture reasoning changes in a meaningful way, add or update a log entry before ending the session.
Each meaningful decision should be logged, even if it remains provisional.

## Naming

Use sortable file names:

- `YYYY-MM-DD-01-topic.md`
- `YYYY-MM-DD-02-topic.md`

## Relationship To Other Docs

- `docs/PROJECT_PLAN.md` tracks sequencing
- `docs/IMPLEMENTATION_STATUS.md` tracks current state
- `docs/ARCHITECTURE_PRINCIPLES.md` captures durable guidance
- `docs/modules/` captures stable module-level design
- `docs/modules/logs/` will capture module working logs later
