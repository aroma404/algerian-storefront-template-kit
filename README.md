# Algerian Storefront Template Kit

This is one self-contained storefront directory. It contains the React storefront, one Express server, an internal durable JSON store, independently owned templates, and tests. It has no Builder, tenant runtime, MySQL, Drizzle, external database, separate API service, or separately deployed frontend.

## Run one server

Copy `.env.example` to `.env`, then run `pnpm install --frozen-lockfile` and `pnpm dev`. The same Express process serves the React application and internal commerce routes on `PORT`, defaulting to `3000`. Run `pnpm build && pnpm start` for production.

The internal data file defaults to `data/store-state.json`; change `STORE_DATA_FILE` only when you need another local or mounted path. Back up this file before server migration or deployment. Do not edit it while the server is running.

| Location | Responsibility |
|---|---|
| `client/src/core/` | One Registry facade, domain types, plugin registry, navigation routes, DZD helper, internal HTTP client and template loader. |
| `client/src/ui/` | React application shell, presentation state, styles and routing only. |
| `client/src/store/` | Directly editable store identity, catalogue, operational rules and chosen template. |
| `templates/` | Twenty-four separately owned template runtimes and responsive CSS files. |
| `server/` | One Express process plus the internal atomic JSON inventory/order store. |
| `data/` | Runtime JSON state created internally; excluded from source control. |

## Configure a new store

Edit the source modules in `client/src/store/`: `identity.ts`, `business.ts`, `catalog.ts`, `operations.ts`, and `template.ts`. Product `image` must match the first entry of ordered `images`, which can contain one to twelve HTTPS image URLs. `template.id` must match an owned directory in `templates/` and a loader exposed through `client/src/core/registry.ts`.

Use `coreRegistry` as the only import entry point for shared store data, plugins, navigation, commerce client, money formatting and template contracts. Keep `ui/` free from direct file-level infrastructure imports. Keep the template runtime and `runtime.css` visually owned by its own template directory.

## Internal commerce routes

`GET /api/health`, `GET /api/catalog`, `GET /api/catalog/:slug`, `POST /api/orders`, and `GET /api/orders/:reference?phone=` are routes inside the same Express process. The server calculates totals from the internal catalogue and serializes order writes, inventory reservation, and atomic JSON file replacement. The browser never determines prices, totals, stock, or order status.

## Verify

Run `pnpm test`, `pnpm check`, and `pnpm build`. Test the selected template on desktop, tablet and mobile, including the collapsed navigation, gallery, cart quantity, checkout errors, successful order creation, and protected tracking. See `SYSTEM-ARCHITECTURE.ar.md` for the detailed Arabic architecture guide.
