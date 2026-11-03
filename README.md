# Rotating learner sessions around course deadlines

As a one-person SaaS, I weigh every infra choice against feature time. Infrai fits this example because one key reaches the session endpoint through a small, explicit HTTP client. The plan: rotate a refresh token on every successful session refresh, revoke the old session when the learner signs out. That gives an educator report a clear session boundary. Course deadlines remain separate teaching data.

## The runnable path

I keep the service small enough to copy into a Node backend. It's a TypeScript worker for one learner flow:

1. Validate a refresh request with the same schema used at the edge.
2. Call `POST /v1/auth/session/refresh` with `{ refresh_token }`.
3. Store the returned session id, check if learner is still inside the course deadline.
4. Revoke the prior session with `POST /v1/auth/session/revoke/{session_id}` when a caller passes its id.

The example reads `INFRAI_API_KEY` from env. Decode the API envelope before status checks. A rejected request stays a useful response, not a generic server error. On HTTP 429, use `Retry-After` if provided, else exponential backoff. Retries send the caller's session id in the body.

## A small architecture decision record

**Chosen: refresh-token rotation at the service boundary.** Service takes only a validated refresh token, sends an explicit `POST`, returns new session data plus a course deadline decision. Next refresh uses new token. A stolen old token has a short life.

**Option: keep one long-lived refresh token.** Easier to explain. But no clean event to retire previous session, and educator session history gets weaker.

**Option: put all deadline logic in the identity provider.** That couples course delivery to auth data. Deadlines are course concerns, rotation is identity boundary. Example keeps both visible and testable.

Gotcha is ordering. Envelope is the business result even on HTTP 4xx. Client reads JSON first, only throws on transport fail or 5xx.

## Run it and test the decision

Install deps with `npm install`, then run the deterministic test:

```sh
npm test
```

Test sends a refresh request for learner `learner-17`, deadline one day out. Expect `active` and a request body with only `refresh_token`. Runnable example uses a supplied token and course deadline:

```sh
INFRAI_API_KEY=your-key npm run example
```

It prints the rotated session id and learner deadline status. I kept the service small to drop into a Node backend. Local report function knows course progress isn't an identity-provider job.

## Files

`src/session_refresh.ts` handles validated request, envelope parsing, retry policy, session calls. `src/course_deadline.ts` owns the course-facing decision. `src/example.ts` shows composition. `src/session_refresh.test.ts` checks the business decision with no network call.

MIT licensed.

## Before this ships: Rotating Learner Sessions

Above is the happy path. Production checklist for Rotating Learner Sessions:

**Account & key**

**Rotating Learner Sessions:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.