# Video Chat Social App

A language-exchange app: sign up, say which language you speak and which you're learning, get matched with
partners, add friends, then chat and video call.

**Stack:** React 19, Vite, Tailwind + DaisyUI, TanStack Query, Zustand · Express 4, MongoDB (Mongoose), JWT cookie auth,
zod validation · [Stream](https://getstream.io) for chat and video.

## Setup

Requires Node ≥ 20.11, a MongoDB database and a free Stream account.

```bash
cp backend/.env.example backend/.env     # fill in MONGO_URI, JWT_SECRET_KEY, STREAM_API_KEY/SECRET
cp frontend/.env.example frontend/.env   # fill in VITE_STREAM_API_KEY
npm install --prefix backend && npm install --prefix frontend

npm run dev:backend    # http://localhost:5001
npm run dev:frontend   # http://localhost:5173
```

Other scripts: `npm test` (backend tests, uses an in-memory MongoDB), `npm run lint`, `npm run build`,
`npm start` (production: serves the API and the built frontend).

## Architecture

```
backend/src
  app.js / server.js     Express app (testable) / process entry: DB connect, listen, graceful shutdown
  config/env.js          validates env vars at startup
  routes -> validators (zod) -> controllers -> services -> models
  middleware/            auth (JWT cookie), validate, central error handler
  lib/stream.js          Stream chat + video tokens, server-side channel creation
frontend/src
  pages/ components/ hooks/ lib/ store/
```

Features: language-based matching with search and filters, friends (unfriend / block / report), live friend-request
notifications, online presence and unread badges, incoming-call ringing, practice stats, profile and password settings,
AI translation and conversation topics, installable PWA.

Key behaviours:

- **Auth:** httpOnly `jwt` cookie (7 days). Password hashes are stripped from every JSON response.
- **Chat / calls:** a channel or call is `"<idA>-<idB>"` (sorted user ids). The server only creates channels and issues call
  tokens for friends; call tokens are scoped to that single call.
- **Friends:** a request becomes a friendship on accept (or auto-accepts if the other user already asked); recipients can
  decline and senders can cancel.
- **Recommendations:** `GET /api/users?page=&limit=&language=` ranks users who speak your target language and are learning yours first.
- **Realtime:** `GET /api/events` is a Server-Sent-Events stream (friend requests, accepts, incoming calls). It keeps its
  connections in memory, so it works for a single server instance; use Redis pub/sub if you scale out. Presence and unread
  counts come from Stream.
- **AI helpers:** `POST /api/ai/translate` and `/api/ai/topics` call Claude (`claude-opus-5-5`, low effort) and need
  `ANTHROPIC_API_KEY`; without it they return 503 and everything else works. They are rate limited per IP.
- **Practice stats:** every video call is recorded per participant (`/api/practice`) and summarised on the Progress page.
- **Errors:** controllers throw `ApiError`; one middleware turns everything into `{ message }` JSON. `GET /api/health` reports DB status.

## Deployment

`npm run build` then `npm start` with `NODE_ENV=production`; the backend serves `frontend/dist`. Use HTTPS (cookies are
`secure` in production) and set `CLIENT_URL` only if the frontend is hosted separately.
