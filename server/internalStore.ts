import crypto from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "../client/src/core/registry";

export type CheckoutRequest = { customerName: string; phone: string; address: string; deliveryId: string; paymentMethod: string; items: Array<{ productId: string; quantity: number; option?: string }> };
export type Operations = { paymentMethods: string[]; deliveryMethods: Array<{ id: string; label: string; feeDzd: number; regions: string[] }>; inventoryMode: "track" | "allow-backorder" };
type StoredOrder = { reference: string; status: "confirmed"; totalDzd: number; createdAt: string; customerName: string; phone: string; address: string; deliveryId: string; paymentMethod: string; items: Array<{ productId: string; productName: string; option: string; quantity: number; unitPriceDzd: number }> };
type StoreState = { version: 1; products: Product[]; orders: StoredOrder[]; inventoryMovements: Array<{ productId: string; quantityDelta: number; reason: "order-reservation"; reference: string; createdAt: string }> };

let writeQueue: Promise<void> = Promise.resolve();
const statePath = () => process.env.STORE_DATA_FILE || path.resolve(process.cwd(), "data", "store-state.json");
const emptyState = (): StoreState => ({ version: 1, products: [], orders: [], inventoryMovements: [] });
const normalizeProduct = (product: Product): Product => ({ ...product, images: product.images?.length ? product.images : [product.image], options: product.options ?? [], tags: product.tags ?? [], stock: Math.max(0, Math.floor(product.stock ?? 0)) });
const createReference = () => `DZ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

async function readState(): Promise<StoreState> {
  try {
    const parsed = JSON.parse(await readFile(statePath(), "utf8")) as Partial<StoreState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.products) || !Array.isArray(parsed.orders) || !Array.isArray(parsed.inventoryMovements)) throw new Error("INVALID_INTERNAL_STORE");
    return { version: 1, products: parsed.products.map(normalizeProduct), orders: parsed.orders as StoredOrder[], inventoryMovements: parsed.inventoryMovements as StoreState["inventoryMovements"] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw error;
  }
}

async function saveState(state: StoreState) {
  const file = statePath();
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

function writeTransaction<T>(operation: (state: StoreState) => T | Promise<T>): Promise<T> {
  const result = writeQueue.then(async () => {
    const state = await readState();
    const output = await operation(state);
    await saveState(state);
    return output;
  });
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

function validate(input: unknown, operations: Operations) {
  if (!input || typeof input !== "object") throw new Error("INVALID_CHECKOUT");
  const raw = input as Partial<CheckoutRequest>;
  if (!Array.isArray(raw.items)) throw new Error("INVALID_CHECKOUT");
  const clean = {
    customerName: String(raw.customerName ?? "").trim().slice(0, 191),
    phone: String(raw.phone ?? "").trim().replace(/\s+/g, " ").slice(0, 64),
    address: String(raw.address ?? "").trim().slice(0, 2000),
    deliveryId: String(raw.deliveryId ?? "").trim(),
    paymentMethod: String(raw.paymentMethod ?? "").trim(),
    items: raw.items.map(item => ({ productId: String(item?.productId ?? "").trim(), quantity: Number(item?.quantity), option: String(item?.option ?? "Standard").trim().slice(0, 120) })),
  };
  if (clean.customerName.length < 2 || clean.phone.length < 6 || clean.address.length < 8 || !clean.items.length || clean.items.length > 30 || clean.items.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) throw new Error("INVALID_CHECKOUT");
  const delivery = operations.deliveryMethods.find(method => method.id === clean.deliveryId);
  if (!delivery || !operations.paymentMethods.includes(clean.paymentMethod)) throw new Error("INVALID_OPERATION");
  return { clean, delivery };
}

export async function seedStore(products: Product[]) {
  return writeTransaction(state => {
    if (state.products.length) return;
    state.products = products.map(normalizeProduct);
  });
}

export async function listProducts(): Promise<Product[]> { return (await readState()).products; }
export async function productBySlug(slug: string): Promise<Product | undefined> { return (await readState()).products.find(product => product.slug === slug); }

export async function createCheckoutOrder(input: CheckoutRequest, operations: Operations) {
  const { clean, delivery } = validate(input, operations);
  return writeTransaction(state => {
    const quantities = new Map<string, number>();
    for (const item of clean.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    const selected = clean.items.map(item => {
      const product = state.products.find(candidate => candidate.id === item.productId);
      if (!product) throw new Error("PRODUCT_UNAVAILABLE");
      return { item, product };
    });
    for (const [productId, quantity] of quantities) {
      const product = state.products.find(candidate => candidate.id === productId)!;
      if (operations.inventoryMode === "track" && product.stock < quantity) throw new Error("INSUFFICIENT_STOCK");
    }
    const merchandiseDzd = selected.reduce((sum, entry) => sum + entry.product.priceDzd * entry.item.quantity, 0);
    const reference = createReference();
    const createdAt = new Date().toISOString();
    if (operations.inventoryMode === "track") for (const [productId, quantity] of quantities) {
      const product = state.products.find(candidate => candidate.id === productId)!;
      product.stock -= quantity;
      state.inventoryMovements.push({ productId, quantityDelta: -quantity, reason: "order-reservation", reference, createdAt });
    }
    const order: StoredOrder = { reference, status: "confirmed", totalDzd: merchandiseDzd + delivery.feeDzd, createdAt, customerName: clean.customerName, phone: clean.phone, address: clean.address, deliveryId: delivery.id, paymentMethod: clean.paymentMethod, items: selected.map(({ item, product }) => ({ productId: product.id, productName: product.name, option: item.option, quantity: item.quantity, unitPriceDzd: product.priceDzd })) };
    state.orders.push(order);
    return { reference: order.reference, status: order.status, totalDzd: order.totalDzd, createdAt: order.createdAt, persisted: true, storage: "internal" as const };
  });
}

export async function trackOrder(orderReference: string, phone: string) {
  const normalizedPhone = phone.trim().replace(/\s+/g, " ");
  const order = (await readState()).orders.find(candidate => candidate.reference === orderReference && candidate.phone === normalizedPhone);
  return order ? { reference: order.reference, status: order.status, totalDzd: order.totalDzd, createdAt: order.createdAt, persisted: true, storage: "internal" as const } : undefined;
}

export function persistenceMode() { return "internal" as const; }
export async function resetInternalStore() { await writeQueue; await rm(statePath(), { force: true }); }
