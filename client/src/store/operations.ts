import type { StoreConfig } from "../core/types";

export const operations: StoreConfig["operations"] = {
  currency: "DZD",
  locale: "en-DZ",
  paymentMethods: ["Cash on delivery", "CIB / Edahabia"],
  deliveryMethods: [
    { id: "algiers", label: "Algiers home delivery", feeDzd: 600, regions: ["Algiers"] },
    { id: "national", label: "National delivery", feeDzd: 900, regions: ["All wilayas"] },
  ],
  inventoryMode: "track",
};
