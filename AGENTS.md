# Project guidance

- Read `docs/project-analysis.md` before feature work. It preserves the project scope, ownership, invariants, and backlog.
- The client includes a storefront, one Store catalog with branch assignments stored in MongoDB, a dashboard backed by NestJS, a browser cart scoped to one branch, checkout with a receipt shared across tabs, and a contact form that prepares email drafts. Accounts and branch settings use the API. The central warehouse is owner-only and its balances are calculated from saved receipts. Branch stock, transfers, and server orders remain pending. Use shared USD calculations for cart displays.
- NestJS reads the Dials Rolex snapshot from MongoDB after an explicit seed. The seed adds demo prices to unpriced models. Use local copies for product photos and keep each model's Dials attribution link. Read `docs/api-contract.md` before changing the API.
- Use ROLX in the interface. Omit demo, preview, and coursework labels from storefront copy. Keep operational messages and original provider URLs and identifiers.
- Keep browser application code in `client/` and API code in `server/`; there is intentionally no root package/workspace. Do not add fake API/database behavior without an assigned task and agreed contract.
- Client boundaries follow the plan: route composition in pages, reusable UI in components, transport in services, client selections in stores. Use typed contracts and the `@/` alias.
- Client checks: from `client/`, run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Server checks: from `server/`, run `npm run typecheck`, `npm run build`, and `npm test`.
