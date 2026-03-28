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
2. Run `npm run bootstrap`.
3. Start the server with `npm run dev`.
4. Confirm the app is live with `curl http://127.0.0.1:3000/health`.
5. Run `npm run test:integration` to exercise the canonical multi-player and multi-session scenario.

This is the fastest reliable walkthrough path because it uses the real WebSocket boundary and does not depend on a separate UI.

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
- the automated harness remains the canonical proof for the richer multi-client and progression scenarios

## Reviewer Notes

- use `docs/implementation/headless-integration-scenario.md` as the plain-language explanation of what the integration harness proves
- use the server logs during `npm run dev` as the lightweight observability surface for joins, rejections, accepted answers, leaderboard updates, and progression snapshot fanout
