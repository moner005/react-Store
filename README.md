# React Store

Structural foundation for the React Store project. The current implementation includes the client shell, navigation, route placeholders, minimal cart state, API client configuration, and an Express health endpoint. The 40 frontend tasks and 12 later backend tasks in [the project plan](docs/project-analysis.md) remain backlog. There is no fake API, database, authentication, checkout, order flow, or inventory mutation yet.

## Requirements

Node.js 24.14.1 and npm. Install each app independently; there is no root workspace.

## Client

```sh
cd client
npm ci
npm run dev
```

Open http://localhost:5173. Client checks: `npm run lint`, `npm run typecheck`, `npm run build`. Copy `.env.example` to `.env` only when changing the API origin. The default API base is `http://localhost:5001`.

## Server

```sh
cd server
npm ci
npm run dev
```

The API listens on port 5001 by default; `GET http://localhost:5001/health` returns the health response. Set `PORT` and `CLIENT_ORIGIN` using `server/.env.example`. Server checks: `npm run typecheck`, `npm run build`, `npm test`.

The server currently exposes only health and safe error responses. `docs/api-contract.md` distinguishes the implemented health contract from future proposed endpoints. The json-server/db.json fake API on port 5000 is not included.
