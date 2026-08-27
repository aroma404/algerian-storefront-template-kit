import type { ComponentType } from "react";
import type { ClientPlugin, Product, StoreConfig, StorePage, TemplateDefinition } from "../types";
import type { OrderInput, OrderReceipt } from "../api";

export type TemplateFamily = "editorial" | "gallery" | "market" | "drop" | "technical" | "ritual" | "pantry" | "play" | "atelier";
export type TemplateExperience = { id: string; navigation: "chapter" | "atelier" | "gallery" | "market" | "index" | "drop" | "minimal" | "maker" | "routine" | "utility" | "activity" | "pantry" | "bookshop" | "festival" | "family"; card: "annotation" | "material" | "framed" | "market" | "index" | "release" | "single" | "maker" | "formula" | "spec" | "performance" | "pantry" | "book" | "festival" | "family"; home: "essay" | "atelier" | "gallery" | "market" | "launch" | "singular" | "maker" | "routine" | "utility" | "pantry" | "bookshop" | "festival" | "family"; catalog: "editorial" | "gallery" | "market" | "index" | "drop" | "technical" | "shelf" | "family"; product: "chapter" | "inspector" | "comparison" | "story" | "spec" | "routine" | "quick"; cart: "ledger" | "bag" | "basket" | "kit"; checkout: "chapter" | "express" | "market" | "studio"; };
export type CartItem = { product: Product; quantity: number; option: string };
export type DeviceViewport = "desktop" | "tablet" | "mobile";
export type TemplateCompositionProps = { template: TemplateDefinition; product: Product };

export type TemplateRuntimeProps = {
  page: StorePage;
  config: StoreConfig;
  template: TemplateDefinition;
  plugins: ClientPlugin[];
  device: DeviceViewport;
  cart: CartItem[];
  filtered: Product[];
  query: string;
  setQuery: (value: string) => void;
  currentProduct: Product;
  featured: Product;
  total: number;
  add: (product: Product, option?: string) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  placeOrder: (input: Omit<OrderInput, "items">) => Promise<OrderReceipt>;
  navigate: (path: string) => void;
  has: (pluginId: string) => boolean;
  TemplateComposition?: ComponentType<TemplateCompositionProps>;
};

export type OwnedTemplateContract = {
  marker: string;
  family: TemplateFamily;
  devices: Record<DeviceViewport, string>;
  experience: TemplateExperience;
  Runtime: ComponentType<TemplateRuntimeProps>;
};
