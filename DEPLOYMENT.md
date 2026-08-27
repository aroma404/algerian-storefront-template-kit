# Internal single-server deployment

Install dependencies with `pnpm install --frozen-lockfile`, run `pnpm test`, `pnpm check`, and `pnpm build`, then start one process with `PORT=3000 pnpm start`. The Express process serves the compiled React storefront and its internal commerce routes from the same origin.

Persist the `data/` directory on durable local storage or a mounted volume. Set `STORE_DATA_FILE` to a writable persistent path when the hosting environment has ephemeral filesystems. Back up the file before updates. No database, proxy, CORS configuration, separate API service, or frontend deployment is necessary.
