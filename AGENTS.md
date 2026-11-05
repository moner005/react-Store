# Project guidance

- Read `docs/project-analysis.md` before feature work. It preserves the project scope, ownership, invariants, and backlog.
- The client integration includes the storefront, Dials catalog, persisted browser cart, cart dashboard, order review, sample branch listings, and contact and auth previews. Use shared USD calculations for cart displays. Stock, authentication, order submission, and email delivery remain pending. The Express server provides a health endpoint.
- Keep browser application code in `client/` and API code in `server/`; there is intentionally no root package/workspace. Do not add fake API/database behavior without an assigned task and agreed contract.
- Client boundaries follow the plan: route composition in pages, reusable UI in components, transport in services, client selections in stores. Use typed contracts and the `@/` alias.
- Client checks: from `client/`, run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Server checks: from `server/`, run `npm run typecheck`, `npm run build`, and `npm test`.
