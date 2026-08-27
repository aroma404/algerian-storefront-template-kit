import type { ClientPlugin } from "../types";

export const clientPlugins: ClientPlugin[] = [
  { id: "announcement-bar", label: "Announcement bar", surfaces: ["home", "catalog", "product"] },
  { id: "catalog-search", label: "Catalog search", surfaces: ["catalog", "search"] },
  { id: "inventory-guard", label: "Inventory guard", surfaces: ["product", "cart", "checkout"] },
];
