import express from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { identity } from "../client/src/store/identity";
import { catalog } from "../client/src/store/catalog";
import { operations } from "../client/src/store/operations";
import { createCheckoutOrder, listProducts, persistenceMode, productBySlug, seedStore, trackOrder, type CheckoutRequest } from "./storeService";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(serverDirectory, process.env.NODE_ENV === "production" ? "client" : "../client");

export function createStorefrontApp({ serveClient = true, development = false }: { serveClient?: boolean; development?: boolean } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Content-Security-Policy", development ? "default-src 'self' data: https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:" : "default-src 'self' https: data:; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'");
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  void seedStore(catalog).catch(error => console.warn("[Storefront] Database seed skipped; use memory mode or run pnpm db:migrate.", error instanceof Error ? error.message : error));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", store: identity.name, currency: "DZD", persistence: persistenceMode() }));
  app.get("/api/catalog", async (_req, res) => { try { res.json(await listProducts()); } catch { res.status(503).json({ error: "CATALOG_UNAVAILABLE" }); } });
  app.get("/api/catalog/:slug", async (req, res) => { try { const product = await productBySlug(req.params.slug); if (!product) return res.status(404).json({ error: "PRODUCT_NOT_FOUND" }); res.json(product); } catch { res.status(503).json({ error: "CATALOG_UNAVAILABLE" }); } });
  app.post("/api/orders", async (req, res) => { try { const order = await createCheckoutOrder(req.body as CheckoutRequest, operations); res.status(201).json(order); } catch (error) { const code = error instanceof Error ? error.message : "CHECKOUT_FAILED"; const status = code === "INVALID_CHECKOUT" || code === "INVALID_OPERATION" ? 400 : code === "PRODUCT_UNAVAILABLE" ? 404 : code === "INSUFFICIENT_STOCK" ? 409 : 500; res.status(status).json({ error: code }); } });
  app.get("/api/orders/:reference", async (req, res) => { try { const phone = typeof req.query.phone === "string" ? req.query.phone : ""; const order = await trackOrder(req.params.reference, phone); if (!order) return res.status(404).json({ error: "ORDER_NOT_FOUND" }); res.json(order); } catch { res.status(503).json({ error: "ORDER_UNAVAILABLE" }); } });
  if (serveClient) {
    app.use(express.static(clientRoot));
    app.get("*", (_req, res) => res.sendFile(path.join(clientRoot, "index.html")));
  }
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createStorefrontApp().listen(process.env.PORT || 3000, () => console.log("Storefront server ready"));
}
