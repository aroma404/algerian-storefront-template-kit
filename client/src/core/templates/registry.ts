import type { OwnedTemplateContract } from "./types";

const loaders: Record<string, () => Promise<{ default: OwnedTemplateContract }>> = {
  "the-essay": () => import("../../../../templates/the-essay/runtime"),
  "atelier-noor": () => import("../../../../templates/atelier-noor/runtime"),
  "frame-gallery": () => import("../../../../templates/frame-gallery/runtime"),
  "souq-grid": () => import("../../../../templates/souq-grid/runtime"),
  "the-index": () => import("../../../../templates/the-index/runtime"),
  "first-light": () => import("../../../../templates/first-light/runtime"),
  "ninety-six": () => import("../../../../templates/ninety-six/runtime"),
  singular: () => import("../../../../templates/singular/runtime"),
  "quiet-form": () => import("../../../../templates/quiet-form/runtime"),
  "makers-mark": () => import("../../../../templates/makers-mark/runtime"),
  "still-water": () => import("../../../../templates/still-water/runtime"),
  "salon-formula": () => import("../../../../templates/salon-formula/runtime"),
  "signal-lab": () => import("../../../../templates/signal-lab/runtime"),
  "motion-unit": () => import("../../../../templates/motion-unit/runtime"),
  "north-line": () => import("../../../../templates/north-line/runtime"),
  larder: () => import("../../../../templates/larder/runtime"),
  "margin-bookshop": () => import("../../../../templates/margin-bookshop/runtime"),
  "the-look": () => import("../../../../templates/the-look/runtime"),
  "plain-sight": () => import("../../../../templates/plain-sight/runtime"),
  tiles: () => import("../../../../templates/tiles/runtime"),
  "medina-market": () => import("../../../../templates/medina-market/runtime"),
  "weekend-office": () => import("../../../../templates/weekend-office/runtime"),
  "maison-arc": () => import("../../../../templates/maison-arc/runtime"),
  "little-rally": () => import("../../../../templates/little-rally/runtime"),
};

export const ownedTemplateIds = Object.keys(loaders);
export const loadOwnedTemplateContract = async (templateId: string): Promise<OwnedTemplateContract> => {
  const loader = loaders[templateId];
  if (!loader) throw new Error(`Unknown owned template contract: ${templateId}`);
  return (await loader()).default;
};
