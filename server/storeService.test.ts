import { beforeAll, describe, expect, it } from "vitest";
import { catalog } from "../client/src/store/catalog";
import { operations } from "../client/src/store/operations";
import { createCheckoutOrder, listProducts, seedStore, trackOrder } from "./storeService";

delete process.env.DATABASE_URL;

describe("store service in development memory mode", () => {
  beforeAll(async () => { await seedStore(catalog); });

  it("calculates the total on the server, reserves stock, and allows protected tracking", async () => {
    const product = (await listProducts())[0]!;
    const order = await createCheckoutOrder({ customerName: "Samira Test", phone: "0550 000 000", address: "12 Test Street, Algiers", deliveryId: operations.deliveryMethods[0]!.id, paymentMethod: operations.paymentMethods[0]!, items: [{ productId: product.id, quantity: 1, option: "Standard" }] }, operations);
    expect(order.persisted).toBe(false);
    expect(order.totalDzd).toBe(product.priceDzd + operations.deliveryMethods[0]!.feeDzd);
    expect((await listProducts()).find(item => item.id === product.id)?.stock).toBe(product.stock - 1);
    expect((await trackOrder(order.reference, "0550 000 000"))?.reference).toBe(order.reference);
    expect(await trackOrder(order.reference, "0550 999 999")).toBeUndefined();
  });

  it("rejects browser-supplied invalid orders before they can reserve stock", async () => {
    await expect(createCheckoutOrder({ customerName: "", phone: "1", address: "x", deliveryId: "invalid", paymentMethod: "invalid", items: [{ productId: "missing", quantity: 0 }] }, operations)).rejects.toThrow("INVALID_CHECKOUT");
  });
});
