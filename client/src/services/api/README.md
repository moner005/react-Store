# Domain API modules

Add the typed modules described in `docs/project-analysis.md` when their tasks are assigned: `products.ts`, `branches.ts`, `inventory.ts`, `orders.ts`, and the shared demo mutation boundary `store.ts`. Auth/user modules belong to the later auth phase.

Use the shared `../apiClient.ts`. No commerce endpoints are implemented by the current server, so the scaffold pages do not call them. Do not create independent stock/order write paths.
