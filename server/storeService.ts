import crypto from "node:crypto";
import type mysql from "mysql2/promise";
import type { Product } from "../client/src/core/types";
import { getPool } from "./db";

export type CheckoutRequest = { customerName: string; phone: string; address: string; deliveryId: string; paymentMethod: string; items: Array<{ productId: string; quantity: number; option?: string }> };
export type Operations = { paymentMethods: string[]; deliveryMethods: Array<{ id: string; label: string; feeDzd: number; regions: string[] }>; inventoryMode: "track" | "allow-backorder" };
type StoredOrder = { reference: string; status: string; totalDzd: number; createdAt: string; customerName: string; phone: string };
const memoryProducts = new Map<string, Product>();
const memoryOrders = new Map<string, StoredOrder>();
let seeded = false;

function parseJson<T>(value: unknown, fallback: T): T { if (typeof value !== "string") return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } }
function normalizeProduct(product: Product): Product { return { ...product, images: product.images.length ? product.images : [product.image], options: product.options ?? [], tags: product.tags ?? [], stock: Math.max(0, Math.floor(product.stock ?? 0)) }; }
function reference() { return `DZ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`; }
function productFromRow(row: Record<string, unknown>): Product { return { id: String(row.id), slug: String(row.slug), name: String(row.name), category: String(row.category), priceDzd: Number(row.price_dzd), compareAtDzd: row.compare_at_dzd === null ? undefined : Number(row.compare_at_dzd), description: String(row.description), image: String(row.image_url), images: parseJson(String(row.images_json ?? "[]"), [String(row.image_url)]), options: parseJson(String(row.options_json ?? "[]"), []), tags: parseJson(String(row.tags_json ?? "[]"), []), stock: Number(row.stock_quantity) }; }

export async function seedStore(products: Product[]) {
  if (seeded) return;
  products.forEach(product => memoryProducts.set(product.id, normalizeProduct(product)));
  const db = getPool();
  if (db) for (const product of products.map(normalizeProduct)) await db.execute(
    "INSERT INTO products (id, slug, name, category, price_dzd, compare_at_dzd, description, image_url, images_json, options_json, tags_json, stock_quantity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE slug=VALUES(slug), name=VALUES(name), category=VALUES(category), price_dzd=VALUES(price_dzd), compare_at_dzd=VALUES(compare_at_dzd), description=VALUES(description), image_url=VALUES(image_url), images_json=VALUES(images_json), options_json=VALUES(options_json), tags_json=VALUES(tags_json)",
    [product.id, product.slug, product.name, product.category, product.priceDzd, product.compareAtDzd ?? null, product.description, product.image, JSON.stringify(product.images), JSON.stringify(product.options), JSON.stringify(product.tags), product.stock],
  );
  seeded = true;
}

export async function listProducts(): Promise<Product[]> {
  const db = getPool();
  if (!db) return [...memoryProducts.values()];
  const [rows] = await db.query("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at ASC");
  return (rows as Array<Record<string, unknown>>).map(productFromRow);
}

export async function productBySlug(slug: string): Promise<Product | undefined> {
  const db = getPool();
  if (!db) return [...memoryProducts.values()].find(product => product.slug === slug);
  const [rows] = await db.execute("SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1", [slug]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? productFromRow(row) : undefined;
}

function validate(input: CheckoutRequest, operations: Operations) {
  const clean = { customerName: input.customerName.trim().slice(0, 191), phone: input.phone.trim().replace(/\s+/g, " ").slice(0, 64), address: input.address.trim().slice(0, 2000), deliveryId: input.deliveryId, paymentMethod: input.paymentMethod, items: input.items.map(item => ({ productId: String(item.productId), quantity: Number(item.quantity), option: String(item.option ?? "Standard").trim().slice(0, 120) })) };
  if (clean.customerName.length < 2 || clean.phone.length < 6 || clean.address.length < 8 || !clean.items.length || clean.items.length > 30 || clean.items.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) throw new Error("INVALID_CHECKOUT");
  const delivery = operations.deliveryMethods.find(method => method.id === clean.deliveryId);
  if (!delivery || !operations.paymentMethods.includes(clean.paymentMethod)) throw new Error("INVALID_OPERATION");
  return { clean, delivery };
}

export async function createCheckoutOrder(input: CheckoutRequest, operations: Operations) {
  const { clean, delivery } = validate(input, operations);
  const db = getPool();
  if (!db) {
    let merchandiseDzd = 0;
    for (const item of clean.items) { const product = memoryProducts.get(item.productId); if (!product) throw new Error("PRODUCT_UNAVAILABLE"); if (operations.inventoryMode === "track" && product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK"); merchandiseDzd += product.priceDzd * item.quantity; memoryProducts.set(product.id, { ...product, stock: operations.inventoryMode === "track" ? product.stock - item.quantity : product.stock }); }
    const order = { reference: reference(), status: "confirmed", totalDzd: merchandiseDzd + delivery.feeDzd, createdAt: new Date().toISOString(), customerName: clean.customerName, phone: clean.phone };
    memoryOrders.set(order.reference, order);
    return { ...order, persisted: false };
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const prepared: Array<{ item: typeof clean.items[number]; product: { id: string; name: string; priceDzd: number; stock: number } }> = [];
    for (const item of clean.items) {
      const [rows] = await connection.execute("SELECT id, name, price_dzd, stock_quantity FROM products WHERE id = ? AND is_active = 1 FOR UPDATE", [item.productId]);
      const row = (rows as Array<Record<string, unknown>>)[0];
      if (!row) throw new Error("PRODUCT_UNAVAILABLE");
      const product = { id: String(row.id), name: String(row.name), priceDzd: Number(row.price_dzd), stock: Number(row.stock_quantity) };
      if (operations.inventoryMode === "track" && product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
      prepared.push({ item, product });
    }
    const merchandiseDzd = prepared.reduce((sum, entry) => sum + entry.product.priceDzd * entry.item.quantity, 0);
    const totalDzd = merchandiseDzd + delivery.feeDzd;
    const orderReference = reference();
    const [insert] = await connection.execute("INSERT INTO orders (order_reference, customer_name, phone, address, delivery_id, delivery_label, delivery_fee_dzd, payment_method, merchandise_dzd, total_dzd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')", [orderReference, clean.customerName, clean.phone, clean.address, delivery.id, delivery.label, delivery.feeDzd, clean.paymentMethod, merchandiseDzd, totalDzd]);
    const orderId = (insert as mysql.ResultSetHeader).insertId;
    for (const { item, product } of prepared) {
      await connection.execute("INSERT INTO order_items (order_id, product_id, product_name, selected_option, unit_price_dzd, quantity, line_total_dzd) VALUES (?, ?, ?, ?, ?, ?, ?)", [orderId, product.id, product.name, item.option, product.priceDzd, item.quantity, product.priceDzd * item.quantity]);
      if (operations.inventoryMode === "track") { await connection.execute("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [item.quantity, product.id]); await connection.execute("INSERT INTO inventory_movements (product_id, quantity_delta, reason, reference) VALUES (?, ?, ?, ?)", [product.id, -item.quantity, "order-reservation", orderReference]); }
    }
    await connection.commit();
    return { reference: orderReference, status: "confirmed", totalDzd, createdAt: new Date().toISOString(), persisted: true };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function trackOrder(orderReference: string, phone: string) {
  const normalizedPhone = phone.trim().replace(/\s+/g, " ");
  const db = getPool();
  if (!db) { const order = memoryOrders.get(orderReference); return order && order.phone === normalizedPhone ? { reference: order.reference, status: order.status, totalDzd: order.totalDzd, createdAt: order.createdAt, persisted: false } : undefined; }
  const [rows] = await db.execute("SELECT order_reference, status, total_dzd, created_at FROM orders WHERE order_reference = ? AND phone = ? LIMIT 1", [orderReference, normalizedPhone]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? { reference: String(row.order_reference), status: String(row.status), totalDzd: Number(row.total_dzd), createdAt: new Date(row.created_at as string).toISOString(), persisted: true } : undefined;
}

export function persistenceMode() { return getPool() ? "mysql" : "memory"; }
