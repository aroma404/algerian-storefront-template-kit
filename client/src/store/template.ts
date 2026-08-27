import type { TemplateDefinition } from "../core/types";

export const template: TemplateDefinition = {
  id: "atelier-noor", label: "Atelier Noor", family: "boutique", description: "A restrained boutique with a focused edit.", navigation: "classic", hero: "story", productGrid: "gallery", productPage: "atelier", checkout: "guided", pageOrder: ["home", "catalog", "search", "product", "cart", "checkout", "tracking", "success", "empty", "not-found"], componentSlots: ["salon-nav", "curated-edit", "atelier-notes", "gift-wrap"], previewAccent: "#806C4A",
};
