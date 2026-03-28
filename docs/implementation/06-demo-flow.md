# 06-demo-flow.md

## Implementation Plan 06: Demo Flow

## Status

Stage-6 baseline. This document captures the current reviewer-facing run and demo flow for the real-time quiz service without introducing a dedicated frontend.

## Goal

Give a reviewer a short, reliable path to:

- install the project
- start the local server
- confirm the health surface
- exercise the automated real-time scenario
- perform a minimal manual WebSocket walkthrough when needed

## Recommended Reviewer Flow

1. Use Node.js `24.x` from `.nvmrc`.
2. Use `nvm` only to select Node, then run `npm run bootstrap`.
3. Start the server with `npm run dev`.
4. Confirm the app is live with `curl http://127.0.0.1:3000/health`.
5. Run `npm run simulate:game` to exercise a real client flow against the running local server.
6. Run `npm run test:integration` to exercise the canonical multi-player and multi-session scenario.

Do not use `nvm run bootstrap`; the repository bootstrap step is an `npm` script, not a standalone `bootstrap` file.

This is the fastest reliable walkthrough path because it uses the real WebSocket boundary and does not depend on a separate UI.

## Verification Modes

The repository now exposes three complementary verification paths:

| Command | Needs Running `npm run dev`? | Strength | Limitation |
| --- | --- | --- | --- |
| `npm run simulate:game` | yes | public-runtime black-box check with several players and clear per-player event logs | currently narrow and happy-path focused |
| `npm run simulate:random-game` | no | multi-round leaderboard narrative in the terminal with a random participant POV | uses the internal progression seam rather than a public host command |
| `npm run test:integration` | no | strongest deterministic proof of transport, isolation, rejection, and progression behavior | less human-readable than the simulator scripts |

## Local Running-Server Simulation

`npm run simulate:game` is a thin reviewer-facing client script that connects to the already running local server on `ws://127.0.0.1:3000/ws` by default.

It currently verifies this shorter live path:

- Alice joins `demo-quiz`
- Bob joins `demo-quiz`
- Carol joins `demo-quiz`
- Alice submits a correct answer for `question-1`
- all three clients receive matching `participant.score.updated` and `leaderboard.updated` events

If needed, point it at a different server with `QUIZ_SERVICE_WS_URL=ws://host:port/ws npm run simulate:game`.

## Optional Randomized Local Simulation

`npm run simulate:random-game` is a separate local-only exploratory script. It does not require a pre-running server and it does not widen the public transport contract.

It currently:

- boots a temporary local app instance with the same WebSocket boundary
- picks 2 to 5 players
- simulates 3 timed questions with internal game-time control and random answers
- advances questions through the internal progression seam instead of a public host command
- prints the ordered leaderboard throughout the game
- logs the observed events for one random participant as a stable point of view

Useful environment variables:

- `SIMULATE_RANDOM_GAME_SEED`
- `SIMULATE_RANDOM_GAME_MIN_PLAYERS`
- `SIMULATE_RANDOM_GAME_MAX_PLAYERS`
- `SIMULATE_RANDOM_GAME_ROUND_MS`
- `SIMULATE_RANDOM_GAME_LATE_WINDOW_MS`

## Manual WebSocket Walkthrough

If a reviewer wants to inspect the protocol manually, the current scaffold is small enough to drive from a browser console.

Terminal 1:

- run `npm run dev`

Browser tab 1 console:

```js
const alice = new WebSocket("ws://127.0.0.1:3000/ws");
alice.addEventListener("message", (event) => {
  console.log("alice", JSON.parse(event.data));
});
alice.addEventListener("open", () => {
  alice.send(JSON.stringify({
    command: "session.join",
    requestId: "req-join-alice",
    payload: {
      quizId: "demo-quiz",
      displayName: "Alice"
    }
  }));
});
```

Browser tab 2 console:

```js
const bob = new WebSocket("ws://127.0.0.1:3000/ws");
bob.addEventListener("message", (event) => {
  console.log("bob", JSON.parse(event.data));
});
bob.addEventListener("open", () => {
  bob.send(JSON.stringify({
    command: "session.join",
    requestId: "req-join-bob",
    payload: {
      quizId: "demo-quiz",
      displayName: "Bob"
    }
  }));
});
```

Then submit an answer from Alice:

```js
alice.send(JSON.stringify({
  command: "answer.submit",
  requestId: "req-answer-alice",
  payload: {
    questionId: "question-1",
    answer: "correct"
  }
}));
```

Expected outcome:

- Alice receives `participant.score.updated` and `leaderboard.updated`
- Bob receives the same session-scoped updates without Alice's `requestId`
- the server terminal shows lightweight structured logs for the join and accepted-answer flow

## Current Limits

- there is still no dedicated frontend or host-facing progression command in the challenge scaffold
- manual walkthrough is best for join and accepted-answer fanout, while progression and late-answer coverage are easier to inspect through `npm run test:integration`
- `npm run simulate:game` is intentionally narrower than the integration suite and currently focuses on the live join plus accepted-answer fanout path
- `npm run simulate:random-game` uses the internal progression seam on purpose, so it is exploratory tooling rather than a proof of a public host protocol
- the automated harness remains the canonical proof for the richer multi-client and progression scenarios

## Reviewer Notes

- use `docs/implementation/headless-integration-scenario.md` as the plain-language explanation of what the integration harness proves
- use `npm run simulate:game` when you want a quick external proof against a running local server without reading the test harness first
- use `npm run simulate:random-game` when you want a broader, more human-readable local game narrative with round-by-round leaderboard output
- use the server logs during `npm run dev` as the lightweight observability surface for joins, rejections, accepted answers, leaderboard updates, and progression snapshot fanout
