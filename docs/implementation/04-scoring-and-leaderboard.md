# 04-scoring-and-leaderboard.md

## Implementation Plan 04: Scoring And Leaderboard

## Status

Placeholder draft. The sequence is provisional and should be refined before implementation starts.

## Goal

Implement answer submission, score mutation, and real-time leaderboard updates.

## Deliverables

- answer submission handling
- score update logic
- deterministic leaderboard generation
- leaderboard broadcast to all session participants

## Detailed Steps

1. Validate submitted answers.
2. Evaluate correctness against quiz data.
3. Update participant score according to defined rules.
4. Recompute leaderboard.
5. Broadcast updated views to session members.

## Exit Criteria

- accepted answers mutate score correctly
- leaderboard updates are visible in real time
- invalid inputs fail gracefully
