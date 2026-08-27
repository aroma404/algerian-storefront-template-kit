import { useEffect, useState } from "react";
import { Storefront } from "./Storefront";
import { clientPlugins } from "../core/plugins";
import { identity } from "../store/identity";
import { business } from "../store/business";
import { operations } from "../store/operations";
import { catalog } from "../store/catalog";
import { template } from "../store/template";
import type { StoreConfig } from "../core/types";
import type { OwnedTemplateContract } from "../core/templates/types";
import { loadOwnedTemplateContract } from "../core/templates/registry";
import "./styles/theme.generated.css";
import "./styles/storefront.css";
const store: StoreConfig = { kitVersion: "1.0.0", templateId: template.id, paletteId: "source-injected", pluginIds: clientPlugins.map(plugin => plugin.id), identity, business, operations, catalog };
export default function App() {
  const [contract, setContract] = useState<OwnedTemplateContract>();
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; void loadOwnedTemplateContract(template.id).then(value => { if (active) setContract(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  if (failed) return <main className="store-load-state"><h1>Template unavailable</h1><p>Check the template id in <code>client/src/store/template.ts</code>.</p></main>;
  if (!contract) return <main className="store-load-state" aria-live="polite"><p>Loading storefront…</p></main>;
  return <Storefront config={store} template={template} contract={contract} plugins={clientPlugins} />;
}
