import { coreRegistry } from "../client/src/core/registry";
import { createCheckoutOrder, listProducts, persistenceMode, productBySlug, resetInternalStore, seedStore, trackOrder, type CheckoutRequest, type Operations } from "./internalStore";

export type { CheckoutRequest, Operations };

export const serverRegistry = Object.freeze({
  core: coreRegistry,
  commerce: Object.freeze({
    seed: seedStore,
    listProducts,
    productBySlug,
    createOrder: createCheckoutOrder,
    trackOrder,
    persistenceMode,
    reset: resetInternalStore,
  }),
});
