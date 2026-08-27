import { storefrontApi, type OrderInput, type OrderReceipt } from "./api";
import { dzd } from "./money";
import { clientPlugins } from "./plugins";
import { loadOwnedTemplateContract, ownedTemplateIds } from "./templates/registry";
import type { CartItem, DeviceViewport, OwnedTemplateContract, TemplateExperience, TemplateRuntimeProps } from "./templates/types";
import type { ClientPlugin, Product, StoreConfig, StorePage, TemplateDefinition } from "./types";
import { business } from "../store/business";
import { catalog } from "../store/catalog";
import { identity } from "../store/identity";
import { operations } from "../store/operations";
import { template } from "../store/template";

export { dzd };
export type { CartItem, ClientPlugin, DeviceViewport, OrderInput, OrderReceipt, OwnedTemplateContract, Product, StoreConfig, StorePage, TemplateDefinition, TemplateExperience, TemplateRuntimeProps };

const store: StoreConfig = Object.freeze({
  kitVersion: "1.0.0",
  templateId: template.id,
  paletteId: "source-injected",
  pluginIds: clientPlugins.map(plugin => plugin.id),
  identity,
  business,
  operations,
  catalog,
});

const navigation = Object.freeze({
  primary: identity.navigation.map(label => ({ label, path: label.toLowerCase() === "home" ? "/" : `/${label.toLowerCase()}` })),
  routes: ["/", "/catalog", "/search", "/product/:slug", "/cart", "/checkout", "/tracking", "/success", "/empty", "/login", "/register"] as const,
});

const plugins = Object.freeze({
  all: clientPlugins,
  has: (pluginId: string) => clientPlugins.some(plugin => plugin.id === pluginId),
});

export const coreRegistry = Object.freeze({
  version: "2.0.0",
  store,
  template,
  navigation,
  plugins,
  commerce: Object.freeze({ api: storefrontApi, money: dzd }),
  templates: Object.freeze({ ids: ownedTemplateIds, load: loadOwnedTemplateContract }),
});
