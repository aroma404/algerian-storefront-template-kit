import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";

let server: Server;
let baseUrl = "";

describe("storefront API", () => {
  beforeAll(async () => {
    process.env.STORE_DATA_FILE = path.join(os.tmpdir(), "template-kit-api-test.json");
    const { serverRegistry } = await import("./registry");
    await serverRegistry.commerce.reset();
    const { createStorefrontApp } = await import("./index");
    server = createStorefrontApp().listen(0);
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server unavailable");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); const { serverRegistry } = await import("./registry"); await serverRegistry.commerce.reset(); delete process.env.STORE_DATA_FILE; });

  it("serves catalog data, calculates a real checkout server-side, and protects tracking", async () => {
    const health = await fetch(`${baseUrl}/api/health`);
    expect(await health.json()).toMatchObject({ status: "ok", persistence: "internal" });
    const catalog = await fetch(`${baseUrl}/api/catalog`);
    const products = await catalog.json() as Array<{ id: string; slug: string }>;
    expect(products[0]?.slug).toBeTruthy();
    const product = await fetch(`${baseUrl}/api/catalog/${products[0]!.slug}`);
    expect(product.status).toBe(200);
    const productData = await product.json() as { id: string; priceDzd: number };
    const created = await fetch(`${baseUrl}/api/orders`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerName: "Template Kit Test", phone: "0550 000 111", address: "12 Example Road, Algiers", items: [{ productId: productData.id, quantity: 1, unitPriceDzd: 1 }], deliveryId: "algiers", paymentMethod: "Cash on delivery", totalDzd: 1 }) });
    expect(created.status).toBe(201);
    const receipt = await created.json() as { reference: string; totalDzd: number };
    expect(receipt.reference).toMatch(/^DZ-/);
    expect(receipt.totalDzd).toBeGreaterThan(productData.priceDzd);
    const tracked = await fetch(`${baseUrl}/api/orders/${receipt.reference}?phone=0550%20000%20111`);
    expect(tracked.status).toBe(200);
    const deniedTracking = await fetch(`${baseUrl}/api/orders/${receipt.reference}?phone=0550%20000%20999`);
    expect(deniedTracking.status).toBe(404);
  });

  it("rejects a forged checkout payload before it can reserve stock", async () => {
    const catalog = await fetch(`${baseUrl}/api/catalog`);
    const products = await catalog.json() as Array<{ id: string }>;
    const forged = await fetch(`${baseUrl}/api/orders`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerName: "", phone: "x", address: "x", items: [{ productId: products[0]!.id, quantity: 0, unitPriceDzd: 1 }], deliveryId: "wrong", paymentMethod: "wrong", totalDzd: 1 }) });
    expect(forged.status).toBe(400);
    expect(await forged.json()).toEqual({ error: "INVALID_CHECKOUT" });
  });
});
