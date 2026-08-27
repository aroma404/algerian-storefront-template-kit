# Algerian Storefront Template Kit

This directory is one independent storefront project. It contains the React customer interface, Express commerce server, MySQL migration, template runtimes, product source data and tests. There is no Builder, tenant configuration, hosted-platform dependency, or second backend service.

## Run one server

Copy `.env.example` to `.env` and set `DATABASE_URL` for persistent MySQL data. Then run `pnpm install --frozen-lockfile`, `pnpm db:migrate`, and `pnpm dev`. The single Express process runs the client and internal commerce routes together through the `PORT` value; it defaults to `3000`.

For production, run `pnpm build` then `pnpm start`. The same Express process serves `dist/client` and the commerce routes. No proxy, separate frontend server, or separate API deployment is required.

| Location | Purpose |
|---|---|
| `client/` | React storefront and editable store source modules |
| `server/` | One Express server, catalogue, checkout, inventory and order-tracking logic |
| `drizzle/` | MySQL schema migration script |
| `templates/` | The independently owned JSX and responsive CSS for 24 templates |
| `scripts/` | One-off maintenance scripts; not required at runtime |

## Configure a store

Edit the TypeScript files in `client/src/store/`: `identity.ts`, `business.ts`, `catalog.ts`, `operations.ts`, and `template.ts`. These are direct source modules, not a runtime configuration service. Select one template in `template.ts`; the matching template runtime is loaded on demand. Products may have one to twelve ordered images, but the cover `image` should match the first item in `images`.

The internal routes stay within the same server: `GET /api/catalog`, `GET /api/catalog/:slug`, `POST /api/orders`, `GET /api/orders/:reference?phone=`, and `GET /api/health`. The server calculates totals from stored product prices and reserves tracked inventory in the same database transaction. It never accepts customer-provided prices or totals.

## Verify

Run `pnpm test`, `pnpm check`, and `pnpm build`. With no `DATABASE_URL`, the project states `memory` mode in `/api/health`; this is only for local development and data is intentionally lost on restart. Configure MySQL before accepting real orders.
