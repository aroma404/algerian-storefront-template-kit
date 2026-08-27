import type { Product } from "../core/types";

export type OrderInput = { customerName: string; phone: string; address: string; deliveryId: string; paymentMethod: string; items: Array<{ productId: string; quantity: number; option: string }> };
export type OrderReceipt = { reference: string; status: string; totalDzd: number; createdAt: string; persisted: boolean };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "REQUEST_FAILED");
  return payload as T;
}

export const storefrontApi = {
  catalog: () => request<Product[]>("/api/catalog"),
  order: (input: OrderInput) => request<OrderReceipt>("/api/orders", { method: "POST", body: JSON.stringify(input) }),
  track: (reference: string, phone: string) => request<OrderReceipt>(`/api/orders/${encodeURIComponent(reference)}?phone=${encodeURIComponent(phone)}`),
};
