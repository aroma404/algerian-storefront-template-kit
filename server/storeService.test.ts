import { afterAll, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import os from "node:os";
import { coreRegistry } from "../client/src/core/registry";
import { serverRegistry } from "./registry";

process.env.STORE_DATA_FILE = path.join(os.tmpdir(), "template-kit-store-service-test.json");

describe("internal store service", () => {
  beforeEach(async () => { await serverRegistry.commerce.reset(); await serverRegistry.commerce.seed(coreRegistry.store.catalog); });
  afterAll(async () => { await serverRegistry.commerce.reset(); delete process.env.STORE_DATA_FILE; });

  it("calculates the total on the server, reserves stock, and allows protected tracking", async () => {
    const product = (await serverRegistry.commerce.listProducts())[0]!;
    const order = await serverRegistry.commerce.createOrder({ customerName: "Samira Test", phone: "0550 000 000", address: "12 Test Street, Algiers", deliveryId: coreRegistry.store.operations.deliveryMethods[0]!.id, paymentMethod: coreRegistry.store.operations.paymentMethods[0]!, items: [{ productId: product.id, quantity: 1, option: "Standard" }] }, coreRegistry.store.operations);
    expect(order.persisted).toBe(true);
    expect(order.storage).toBe("internal");
    expect(order.totalDzd).toBe(product.priceDzd + coreRegistry.store.operations.deliveryMethods[0]!.feeDzd);
    expect((await serverRegistry.commerce.listProducts()).find(item => item.id === product.id)?.stock).toBe(product.stock - 1);
    expect((await serverRegistry.commerce.trackOrder(order.reference, "0550 000 000"))?.reference).toBe(order.reference);
    expect(await serverRegistry.commerce.trackOrder(order.reference, "0550 999 999")).toBeUndefined();
  });

  it("rejects browser-supplied invalid orders before they can reserve stock", async () => {
    await expect(serverRegistry.commerce.createOrder({ customerName: "", phone: "1", address: "x", deliveryId: "invalid", paymentMethod: "invalid", items: [{ productId: "missing", quantity: 0 }] }, coreRegistry.store.operations)).rejects.toThrow("INVALID_CHECKOUT");
  });

  it("serializes competing orders so tracked stock is never oversold", async () => {
    await serverRegistry.commerce.reset();
    const onlyProduct = { ...coreRegistry.store.catalog[0]!, stock: 1 };
    await serverRegistry.commerce.seed([onlyProduct]);
    const order = () => serverRegistry.commerce.createOrder({ customerName: "Concurrent Buyer", phone: "0550 000 010", address: "12 Test Street, Algiers", deliveryId: coreRegistry.store.operations.deliveryMethods[0]!.id, paymentMethod: coreRegistry.store.operations.paymentMethods[0]!, items: [{ productId: onlyProduct.id, quantity: 1, option: "Standard" }] }, coreRegistry.store.operations);
    const results = await Promise.allSettled([order(), order()]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    expect((await serverRegistry.commerce.listProducts())[0]?.stock).toBe(0);
  });
});
