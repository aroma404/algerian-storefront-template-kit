import type { Product } from "../core/types";

export const catalog: Product[] = [
  { id: "halia-throw", name: "Halia Woven Throw", slug: "halia-woven-throw", category: "Home", priceDzd: 8900, description: "A soft, weighty woven layer for quiet rooms and slow weekends.", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85", images: ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85", "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1100&q=85"], options: [{ name: "Colour", values: ["Natural", "Ochre", "Ink"] }], stock: 12, tags: ["textile", "home"] },
];
